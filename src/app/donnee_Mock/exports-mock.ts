import { HttpInterceptorFn, HttpParams, HttpResponse } from '@angular/common/http';
import { from, Observable, switchMap } from 'rxjs';
import { ApercusExport, ContexteExports, GraphiqueExportable, ResumeExport } from '../features/exports/data-access/exports.modeles';
import { urlExports } from '../features/exports/data-access/exports.service';
import { LangueDocument } from '../shared/utils/langue-document';
import { nomMois } from '../shared/utils/nom-mois';
import { construireAnalyseZonesMock } from './analyse-zones-mock';
import { campagneActive } from './campagnes-mock';
import { construireEchantillonnageMock } from './echantillonnage-mock';
import { construireImageGraphique, DonneesImage } from './exports-images-mock';
import { construireCsvMock, construirePdfTexteMock } from './fichiers-mock';
import { profilDeRequete } from './profil-mock';
import { refusMock, reponseMock } from './reponses-mock';
import { construireTableauDeBordMock } from './tableau-de-bord-mock';

// DONNÉES DE TEST du centre d'exports (CDC §8.14). Même statut temporaire que comptes-mock.ts.
// Les vrais fichiers sont produits par le serveur : ici, le navigateur en fabrique de vrais (CSV, PDF d'une page,
// PNG dessiné au canvas) pour vérifier le téléchargement. Excel (.xlsx) n'est pas fabriqué : on renvoie un CSV.
const delaiMs = 800;
const delaiPdfMs = 1500;

interface Filtres {
  readonly campagne: string;
  readonly cooperative?: string;
  readonly zone?: string;
  readonly langue: LangueDocument;
}

function filtresDe(parametres: HttpParams): Filtres {
  return {
    campagne: parametres.get('campagne') ?? campagneActive() ?? '2026',
    cooperative: parametres.get('cooperative') ?? undefined,
    zone: parametres.get('zone') ?? undefined,
    langue: parametres.get('langue') === 'en' ? 'en' : 'fr',
  };
}

const textes = {
  fr: {
    entetes: ['Producteur', 'Village', 'Commune', 'Coopérative', 'Zone', 'Statut de validation'],
    fleurs: 'Fleurs',
    total: 'Total',
    statuts: { valide: 'Validé', 'en-attente': 'En attente' },
    resume: (c: Chiffres) =>
      `Campagne ${c.campagne}${c.perimetre}\n${c.producteurs} producteurs suivis (${c.couverture} % de l'échantillon)\n` +
      `${c.fleurs} fleurs observées, pic en ${c.moisPic}\nProduction estimée : ${c.production} kg de vanille verte\n` +
      `${c.saisies} % des saisies validées`,
    titrePdf: (campagne: string) => `Rapport officiel - campagne ${campagne}`,
    notePdf: 'Brouillon de test : les graphiques et le tableau des producteurs sont fournis par le serveur.',
    campagne: (campagne: string) => `Campagne ${campagne}`,
    graphiques: {
      'floraison-mensuelle': 'Évolution mensuelle',
      'repartition-zones': 'Répartition zones',
      'analyse-zones': 'Analyse par zone',
      'comparaison-saisons': 'Comparaison 3 saisons',
    } satisfies Record<GraphiqueExportable, string>,
    descriptions: {
      'floraison-mensuelle': 'Fleurs observées chaque mois, par zone',
      'repartition-zones': 'Part de chaque zone dans la floraison de la campagne',
      'analyse-zones': 'Floraison mensuelle de chaque zone',
      'comparaison-saisons': 'Floraison mensuelle des trois dernières saisons',
    } satisfies Record<GraphiqueExportable, string>,
  },
  en: {
    entetes: ['Farmer', 'Village', 'Commune', 'Cooperative', 'Zone', 'Validation status'],
    fleurs: 'Flowers',
    total: 'Total',
    statuts: { valide: 'Validated', 'en-attente': 'Pending' },
    resume: (c: Chiffres) =>
      `Campaign ${c.campagne}${c.perimetre}\n${c.producteurs} farmers followed (${c.couverture} % of the sample)\n` +
      `${c.fleurs} flowers observed, peak in ${c.moisPic}\nEstimated production: ${c.production} kg of green vanilla\n` +
      `${c.saisies} % of the entries validated`,
    titrePdf: (campagne: string) => `Official report - campaign ${campagne}`,
    notePdf: 'Test draft: the charts and the farmers table are provided by the server.',
    campagne: (campagne: string) => `Campaign ${campagne}`,
    graphiques: {
      'floraison-mensuelle': 'Monthly trend',
      'repartition-zones': 'Zone distribution',
      'analyse-zones': 'Zone analysis',
      'comparaison-saisons': '3-season comparison',
    } satisfies Record<GraphiqueExportable, string>,
    descriptions: {
      'floraison-mensuelle': 'Flowers observed each month, by zone',
      'repartition-zones': 'Share of each zone in the campaign flowering',
      'analyse-zones': 'Monthly flowering of each zone',
      'comparaison-saisons': 'Monthly flowering of the last three seasons',
    } satisfies Record<GraphiqueExportable, string>,
  },
} as const;

interface Chiffres {
  readonly campagne: string;
  readonly perimetre: string; // « · OP Sava · Zone Littorale »
  readonly producteurs: string;
  readonly couverture: string;
  readonly fleurs: string;
  readonly moisPic: string;
  readonly production: string;
  readonly saisies: string;
}

// Part de la zone dans le total (le mock du tableau de bord ne filtre pas par zone) : même chiffre que l'analyse par zone.
function partDeZone(filtres: Filtres): number {
  const zone = construireAnalyseZonesMock({ campagne: filtres.campagne, cooperative: filtres.cooperative }).zones.find(
    (candidate) => candidate.id === filtres.zone,
  );
  return zone ? zone.partTotal / 100 : 1;
}

function construireResume(filtres: Filtres): ResumeExport {
  const tableau = construireTableauDeBordMock({ campagne: filtres.campagne, cooperative: filtres.cooperative });
  const part = partDeZone(filtres);
  const nombre = (valeur: number) => new Intl.NumberFormat(filtres.langue).format(Math.round(valeur * part));
  const cooperative = tableau.cooperatives.find((candidate) => candidate.id === filtres.cooperative)?.nom;
  const zone = construireEchantillonnageMock(new HttpParams()).zones.find((candidate) => candidate.id === filtres.zone)?.nom;
  const perimetre = [cooperative, zone].filter(Boolean).map((element) => ` · ${element}`).join('');
  return {
    texte: textes[filtres.langue].resume({
      campagne: filtres.campagne,
      perimetre,
      producteurs: nombre(tableau.producteursSuivis),
      couverture: String(tableau.tauxCouverture),
      fleurs: nombre(tableau.totalFleurs),
      moisPic: nomMois(filtres.langue, tableau.moisPic, 'long'),
      production: nombre(tableau.productionEstimeeKg),
      saisies: String(tableau.tauxSaisiesValides),
    }),
  };
}

function construireCsv(filtres: Filtres): Blob {
  const t = textes[filtres.langue];
  const separateur = filtres.langue === 'fr' ? ';' : ',';
  const tableau = construireTableauDeBordMock({ campagne: filtres.campagne, cooperative: filtres.cooperative });
  const producteurs = construireEchantillonnageMock(
    new HttpParams({
      fromObject: {
        campagne: filtres.campagne,
        ...(filtres.cooperative ? { cooperative: filtres.cooperative } : {}),
        ...(filtres.zone ? { zone: filtres.zone } : {}),
        page: '1',
        taille: '100000',
      },
    }),
  ).producteurs.lignes;

  const entete = [
    ...t.entetes,
    ...tableau.floraisonMensuelle.map((ligne) => `${t.fleurs} ${nomMois(filtres.langue, ligne.mois, 'short')}`),
    t.total,
  ];
  const lignes = producteurs.map((producteur, i) => {
    // Floraison fictive mais stable : la part du total du mois varie d'un producteur à l'autre.
    const fleurs = tableau.floraisonMensuelle.map((ligne) =>
      Math.round((ligne.fleursParZone.reduce((a, b) => a + b, 0) / producteurs.length) * (0.6 + ((i * 7 + ligne.mois) % 9) / 10)),
    );
    return [
      producteur.nom,
      producteur.village,
      producteur.commune,
      producteur.cooperative,
      producteur.zone,
      t.statuts[producteur.statutValidation],
      ...fleurs.map(String),
      String(fleurs.reduce((a, b) => a + b, 0)),
    ];
  });
  return construireCsvMock([entete, ...lignes], separateur);
}

function construirePdf(filtres: Filtres): Blob {
  const t = textes[filtres.langue];
  const couper = (ligne: string) => ligne.match(/.{1,85}(\s|$)/g)?.map((morceau) => morceau.trim()) ?? [ligne];
  return construirePdfTexteMock([
    t.titrePdf(filtres.campagne),
    '',
    ...construireResume(filtres).texte.split('\n').flatMap(couper),
    '',
    ...couper(t.notePdf),
  ]);
}

const somme = (valeurs: readonly number[]) => valeurs.reduce((total, valeur) => total + valeur, 0);

// Données des aperçus de la page, pour le périmètre demandé. Les trois dernières saisons : la campagne choisie et les
// deux qui la précèdent (moins s'il n'y en a pas assez). Une zone inconnue du mock donne toutes les zones.
function construireApercus(filtres: Filtres): ApercusExport {
  const analyse = construireAnalyseZonesMock({ campagne: filtres.campagne, cooperative: filtres.cooperative });
  const choisies = analyse.zones.filter((zone) => zone.id === filtres.zone);
  const zones = choisies.length > 0 ? choisies : analyse.zones;
  const anciennes = (zone: (typeof zones)[number]) => zone.historique.slice(-2);
  const saisons = (zone: (typeof zones)[number]) => [...anciennes(zone).map((ancienne) => ancienne.mensuel), zone.mensuel];
  return {
    zones: zones.map((zone) => zone.nom),
    mensuel: zones[0].mensuel.map((ligne, i) => ({ mois: ligne.mois, fleursParZone: zones.map((zone) => zone.mensuel[i].fleurs) })),
    saisons: {
      campagnes: [...anciennes(zones[0]).map((ancienne) => ancienne.campagne), analyse.campagne],
      mois: zones[0].mensuel.map((ligne, i) => ({
        mois: ligne.mois,
        fleurs: saisons(zones[0]).map((_, s) => somme(zones.map((zone) => saisons(zone)[s][i].fleurs))),
      })),
    },
  };
}

// Image d'un graphique exportable : mêmes données que son aperçu, dessinée comme lui (voir exports-images-mock.ts).
function construireImage(graphique: GraphiqueExportable, filtres: Filtres): Promise<Blob> {
  const t = textes[filtres.langue];
  const apercus = construireApercus(filtres);
  const mois = apercus.mensuel.map((ligne) => nomMois(filtres.langue, ligne.mois, 'short'));
  const parZone = apercus.zones.map((nom, z) => ({ nom, valeurs: apercus.mensuel.map((ligne) => ligne.fleursParZone[z]) }));
  const parSaison = apercus.saisons.campagnes.map((nom, s) => ({ nom, valeurs: apercus.saisons.mois.map((ligne) => ligne.fleurs[s]) }));
  const totaux = parZone.map((serie) => ({ nom: serie.nom, valeurs: [somme(serie.valeurs)] }));
  const donnees: Record<GraphiqueExportable, Pick<DonneesImage, 'type' | 'etiquettes' | 'series' | 'total'>> = {
    'floraison-mensuelle': { type: 'empile', etiquettes: mois, series: parZone },
    'repartition-zones': {
      type: 'anneau',
      etiquettes: [],
      series: totaux,
      total: new Intl.NumberFormat(filtres.langue).format(somme(totaux.map((serie) => serie.valeurs[0]))),
    },
    'analyse-zones': { type: 'courbes', etiquettes: mois, series: parZone },
    'comparaison-saisons': { type: 'courbes', etiquettes: mois, series: parSaison },
  };
  return construireImageGraphique({
    ...donnees[graphique],
    titre: t.graphiques[graphique],
    description: `${t.descriptions[graphique]} · ${t.campagne(filtres.campagne)}`,
  });
}

const reponse = <T>(corps: T, delai: number, nomFichier?: string) => reponseMock(corps, delai, nomFichier);
const refus = (status: number) => refusMock(status, urlExports, delaiMs);

function repondre(chemin: string, filtres: Filtres): Observable<HttpResponse<unknown>> | undefined {
  if (chemin === '/producteurs') {
    // Excel n'est pas fabriqué par le mock : le CSV est renvoyé dans les deux cas.
    return reponse(construireCsv(filtres), delaiMs, `producteurs_${filtres.campagne}.csv`);
  }
  if (chemin === '/rapport-pdf') {
    return reponse(construirePdf(filtres), delaiPdfMs, `rapport_vanille_${filtres.campagne}.pdf`);
  }
  if (chemin === '/resume') {
    return reponse(construireResume(filtres), delaiMs);
  }
  if (chemin === '/apercus') {
    return reponse(construireApercus(filtres), delaiMs);
  }
  const graphique = /^\/graphiques\/(.+)$/.exec(chemin)?.[1] as GraphiqueExportable | undefined;
  if (graphique && graphique in textes.fr.graphiques) {
    return from(construireImage(graphique, filtres)).pipe(
      switchMap((image) => reponse(image, delaiMs, `${graphique}-${filtres.campagne}.png`)),
    );
  }
  return undefined;
}

// Joue le rôle du serveur pour /exports. Les visiteurs n'ont aucun accès : 403, comme un vrai serveur.
export const exportsMockInterceptor: HttpInterceptorFn = (requete, suivant) => {
  if (requete.method !== 'GET' || !requete.url.startsWith(urlExports)) {
    return suivant(requete);
  }
  const profil = profilDeRequete(requete);
  const peutExporter = profil === 'super-administrateur' || profil === 'utilisateur';
  const chemin = requete.url.slice(urlExports.length);

  if (chemin === '') {
    const echantillon = construireEchantillonnageMock(new HttpParams());
    const contexte: ContexteExports = {
      peutExporter,
      region: 'SAVA',
      campagne: campagneActive() ?? echantillon.campagneEnCours,
      campagnes: echantillon.campagnes,
      cooperatives: echantillon.cooperatives,
      zones: echantillon.zones,
    };
    return reponse(contexte, delaiMs);
  }
  if (!peutExporter) {
    return refus(403);
  }
  return repondre(chemin, filtresDe(requete.params)) ?? suivant(requete);
};
