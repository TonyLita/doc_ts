import { HttpInterceptorFn } from '@angular/common/http';
import { ProfilPeriode } from '../features/analyse-zones/data-access/analyse-zones.modeles';
import {
  ContexteRapports,
  DemandeRapport,
  LangueRapport,
  RapportGenere,
  TypeRapport,
} from '../features/rapports-ia/data-access/rapports-ia.modeles';
import { urlRapportsIa } from '../features/rapports-ia/data-access/rapports-ia.service';
import { nomMois } from '../shared/utils/nom-mois';
import { construireAnalyseZonesMock } from './analyse-zones-mock';
import { campagneActive } from './campagnes-mock';
import { profilDeRequete } from './profil-mock';
import { refusMock, reponseMock } from './reponses-mock';
import { construireTableauDeBordMock } from './tableau-de-bord-mock';

// DONNÉES DE TEST des rapports IA (CDC §8.13). Même statut temporaire que comptes-mock.ts.
// Aucune IA ici : le texte est composé à partir des autres données de test, ce que ferait le serveur avec les
// données réelles avant de les confier au service d'IA (le navigateur, lui, n'envoie jamais de chiffres).
const delaiGenerationMs = 1500; // un appel d'IA est lent : on voit l'état de chargement
const longueurMaxInstructions = 1000;
const typesValides: readonly TypeRapport[] = ['synthese', 'analyse-zone', 'prevision', 'personnalise'];

interface Chiffres {
  readonly campagne: string;
  readonly precedente: string;
  readonly producteurs: string;
  readonly couverture: string;
  readonly fleurs: string;
  readonly moisPic: string;
  readonly production: string;
  readonly productionPrecedente: string;
  readonly saisies: string;
  readonly evolution: string; // variation du total de fleurs par rapport à la campagne précédente, ex. « +18 % »
  readonly zones: readonly { nom: string; fleurs: string; part: string; profil: ProfilPeriode }[];
}

interface Modele {
  readonly synthese: (c: Chiffres) => string;
  readonly profil: Readonly<Record<ProfilPeriode, (zone: Chiffres['zones'][number]) => string>>;
  readonly analyseZone: (c: Chiffres, parZone: string) => string;
  readonly prevision: (c: Chiffres) => string;
  readonly personnalise: (c: Chiffres, instructions: string | undefined) => string;
}

const modeles: Readonly<Record<LangueRapport, Modele>> = {
  fr: {
    synthese: (c) =>
      `Campagne ${c.campagne} : ${c.producteurs} producteurs suivis (${c.couverture} % de l'échantillon) ont permis d'observer ${c.fleurs} fleurs, avec un pic de floraison en ${c.moisPic}.\n\n` +
      `Par rapport à la campagne ${c.precedente}, le total de fleurs observées évolue de ${c.evolution}. La production estimée atteint ${c.production} kg de vanille verte.\n\n` +
      `${c.saisies} % des saisies sont validées : seules celles-ci alimentent les chiffres de ce rapport.`,
    profil: {
      precoce: (z) => `${z.nom} : floraison précoce, ${z.fleurs} fleurs (${z.part} % du total). La collecte peut y démarrer plus tôt que la moyenne régionale.`,
      normal: (z) => `${z.nom} : floraison conforme à la moyenne régionale, ${z.fleurs} fleurs (${z.part} % du total). Aucune action particulière.`,
      retarde: (z) => `${z.nom} : floraison retardée, ${z.fleurs} fleurs (${z.part} % du total). Les équipes de pollinisation y sont à prioriser.`,
    },
    analyseZone: (c, parZone) => `Analyse par zone, campagne ${c.campagne} (${c.fleurs} fleurs au total).\n\n${parZone}`,
    prevision: (c) =>
      `Prévision de production, campagne ${c.campagne} : sur la base de ${c.fleurs} fleurs observées, la production estimée est de ${c.production} kg de vanille verte, contre ${c.productionPrecedente} kg pour la campagne ${c.precedente}.\n\n` +
      `Cette estimation applique un coefficient de conversion des fleurs en kilos qui reste à valider avec l'équipe agronomique.`,
    personnalise: (c, instructions) =>
      `Campagne ${c.campagne} : ${c.fleurs} fleurs observées, pic en ${c.moisPic}, production estimée à ${c.production} kg.\n\n` +
      (instructions ? `Consignes prises en compte : ${instructions}` : `Aucune consigne complémentaire n'a été fournie.`),
  },
  en: {
    synthese: (c) =>
      `Campaign ${c.campagne}: ${c.producteurs} farmers followed (${c.couverture} % of the sample) allowed ${c.fleurs} flowers to be observed, with a flowering peak in ${c.moisPic}.\n\n` +
      `Compared with campaign ${c.precedente}, the total number of flowers observed changed by ${c.evolution}. Estimated production reaches ${c.production} kg of green vanilla.\n\n` +
      `${c.saisies} % of the entries are validated: only these feed the figures of this report.`,
    profil: {
      precoce: (z) => `${z.nom}: early flowering, ${z.fleurs} flowers (${z.part} % of the total). Collection can start earlier than the regional average.`,
      normal: (z) => `${z.nom}: flowering in line with the regional average, ${z.fleurs} flowers (${z.part} % of the total). No particular action.`,
      retarde: (z) => `${z.nom}: late flowering, ${z.fleurs} flowers (${z.part} % of the total). Pollination teams should be prioritised there.`,
    },
    analyseZone: (c, parZone) => `Zone analysis, campaign ${c.campagne} (${c.fleurs} flowers in total).\n\n${parZone}`,
    prevision: (c) =>
      `Production forecast, campaign ${c.campagne}: based on ${c.fleurs} flowers observed, estimated production is ${c.production} kg of green vanilla, against ${c.productionPrecedente} kg for campaign ${c.precedente}.\n\n` +
      `This estimate applies a flowers-to-kilos conversion coefficient that is still to be validated with the agronomy team.`,
    personnalise: (c, instructions) =>
      `Campaign ${c.campagne}: ${c.fleurs} flowers observed, peak in ${c.moisPic}, production estimated at ${c.production} kg.\n\n` +
      (instructions ? `Instructions taken into account: ${instructions}` : `No additional instructions were provided.`),
  },
};

function chiffresDe(campagne: string, langue: LangueRapport): Chiffres {
  const precedente = String(Number(campagne) - 1);
  const tableau = construireTableauDeBordMock({ campagne });
  const avant = construireTableauDeBordMock({ campagne: precedente });
  const analyse = construireAnalyseZonesMock({ campagne });
  const nombre = (valeur: number) => new Intl.NumberFormat(langue).format(valeur);
  const variation = Math.round(((tableau.totalFleurs - avant.totalFleurs) / avant.totalFleurs) * 100);

  return {
    campagne,
    precedente,
    producteurs: nombre(tableau.producteursSuivis),
    couverture: nombre(tableau.tauxCouverture),
    fleurs: nombre(tableau.totalFleurs),
    moisPic: nomMois(langue, tableau.moisPic, 'long'),
    production: nombre(tableau.productionEstimeeKg),
    productionPrecedente: nombre(avant.productionEstimeeKg),
    saisies: nombre(tableau.tauxSaisiesValides),
    evolution: `${variation >= 0 ? '+' : ''}${nombre(variation)} %`,
    zones: analyse.zones.map((zone) => ({
      nom: zone.nom,
      fleurs: nombre(zone.fleurs),
      part: nombre(zone.partTotal),
      profil: zone.profil,
    })),
  };
}

function composerRapport(campagne: string, demande: DemandeRapport): RapportGenere {
  const modele = modeles[demande.langue];
  const chiffres = chiffresDe(campagne, demande.langue);
  const parZone = chiffres.zones.map((zone) => modele.profil[zone.profil](zone)).join('\n\n');
  const textes: Readonly<Record<TypeRapport, string>> = {
    synthese: modele.synthese(chiffres),
    'analyse-zone': modele.analyseZone(chiffres, parZone),
    prevision: modele.prevision(chiffres),
    personnalise: modele.personnalise(chiffres, demande.instructions),
  };
  return {
    texte: textes[demande.type],
    campagne,
    donneesAu: construireTableauDeBordMock({ campagne }).derniereSynchronisation,
  };
}

const reponse = <T>(corps: T, delai: number) => reponseMock(corps, delai);
const refus = (status: number, delai: number) => refusMock(status, urlRapportsIa, delai);

// Joue le rôle du serveur pour /rapports-ia. Les visiteurs n'ont pas le droit de générer : 403, comme un vrai serveur.
export const rapportsIaMockInterceptor: HttpInterceptorFn = (requete, suivant) => {
  if (requete.url !== urlRapportsIa) {
    return suivant(requete);
  }
  const profil = profilDeRequete(requete);
  const peutGenerer = profil !== undefined && profil !== 'visiteur';
  const campagne = campagneActive() ?? '2026';

  if (requete.method === 'GET') {
    const corps: ContexteRapports = { campagne, peutGenerer };
    return reponse(corps, 400);
  }
  if (requete.method !== 'POST') {
    return suivant(requete);
  }
  if (!peutGenerer) {
    return refus(403, 400);
  }
  const demande = requete.body as DemandeRapport;
  if (!typesValides.includes(demande.type) || (demande.instructions?.length ?? 0) > longueurMaxInstructions) {
    return refus(422, 400);
  }
  return reponse(composerRapport(campagne, demande), delaiGenerationMs);
};
