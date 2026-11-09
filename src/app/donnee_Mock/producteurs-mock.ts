import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpParams, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DonneesProgramme,
  FicheProducteur,
  Genre,
  LigneProducteur,
  ObservationProducteur,
  ParcelleProducteur,
  ProgrammeProducteur,
  Producteurs,
  StatutEchantillonnage,
} from '../features/referentiel-producteurs/data-access/producteurs.modeles';
import {
  ChoixProducteur,
  FloraisonProducteur,
  SaisieFloraison,
} from '../features/referentiel-producteurs/data-access/floraison.modeles';
import { urlFloraison } from '../features/referentiel-producteurs/data-access/floraison.service';
import { urlProducteurs } from '../features/referentiel-producteurs/data-access/producteurs.service';
import { LangueDocument } from '../shared/utils/langue-document';
import { nomMois } from '../shared/utils/nom-mois';
import { delaiSimuleMs } from './connexion-mock.interceptor';
import { listerCooperatives } from './cooperatives-mock';
import { profilDeRequete } from './profil-mock';
import { communesAvecVillages, zoneDuVillage, zonesLocalisees } from './geographie-mock';
import { construireCsvMock, construirePdfTexteMock } from './fichiers-mock';
import { refusMock, reponseMock } from './reponses-mock';

// DONNÉES DE TEST du référentiel des producteurs (CDC §8.4). Même statut temporaire que comptes-mock.ts.
// L'identité et la localisation jouent le rôle de l'API externe (lecture seule) ; la couche du programme
// (coopérative, pieds, âge, statut) vit en mémoire : les enregistrements la modifient jusqu'au rechargement de la page.
// Les producteurs d'une coopérative sont aussi nombreux que ses « producteurs membres » (référentiel des coopératives) ;
// douze autres n'ont pas encore de couche locale (« à compléter »). La zone vient du village (référentiel géographique).
// Les saisies de floraison (CDC : saisie mobile ; ici une saisie web demandée en extension) vivent aussi en mémoire :
// quelques saisies par parcelle pour les producteurs suivis au départ, que les nouvelles saisies complètent.
// Sans aléatoire : les mêmes producteurs à chaque démarrage.
interface Identite {
  readonly id: string;
  readonly code: string;
  readonly nom: string;
  readonly prenom: string;
  readonly genre: Genre;
  readonly village: string; // identifiant du village
  readonly numero: number; // rang de génération : alimente les valeurs dérivées (parcelles, observations)
}

type Programme = Omit<DonneesProgramme, 'statut'> & { readonly statut: StatutEchantillonnage };

// 23 noms et 24 prénoms : leurs longueurs sont premières entre elles, donc les couples se répètent peu (quelques
// homonymes restent, comme en vrai : le code producteur les distingue).
const nomsDeFamille = [
  'Rakoto', 'Rabe', 'Randria', 'Rasoa', 'Razafy', 'Rakotomalala', 'Andriamanana', 'Ravelo',
  'Randrianasolo', 'Rasolofo', 'Ratsimba', 'Rajaonarivelo', 'Razanamahefa', 'Raharison', 'Rakotonirina',
  'Rasamoelina', 'Randriamiarana', 'Rakotoarisoa', 'Ramanantsoa', 'Rafanomezana', 'Rajoelina',
  'Rasolonjatovo', 'Ravoniarisoa',
] as const;
const prenoms: readonly { readonly nom: string; readonly genre: Genre }[] = [
  { nom: 'Jean', genre: 'homme' }, { nom: 'Marie', genre: 'femme' }, { nom: 'Hery', genre: 'homme' },
  { nom: 'Voahangy', genre: 'femme' }, { nom: 'Naivo', genre: 'homme' }, { nom: 'Tiana', genre: 'femme' },
  { nom: 'Fidy', genre: 'homme' }, { nom: 'Lalaina', genre: 'femme' }, { nom: 'Mamy', genre: 'homme' },
  { nom: 'Soa', genre: 'femme' }, { nom: 'Faly', genre: 'homme' }, { nom: 'Nirina', genre: 'femme' },
  { nom: 'Toky', genre: 'homme' }, { nom: 'Haingo', genre: 'femme' }, { nom: 'Zo', genre: 'homme' },
  { nom: 'Mirana', genre: 'femme' }, { nom: 'Andry', genre: 'homme' }, { nom: 'Hasina', genre: 'femme' },
  { nom: 'Rado', genre: 'homme' }, { nom: 'Fara', genre: 'femme' }, { nom: 'Njaka', genre: 'homme' },
  { nom: 'Lanto', genre: 'femme' }, { nom: 'Tahina', genre: 'homme' }, { nom: 'Mialy', genre: 'femme' },
];

const producteursSansCoucheLocale = 12;
const partSuiviActif = 78; // % des producteurs d'une coopérative en suivi actif, comme le taux de couverture de test
const campagneEnCours = '2026';
const campagnePrecedente = '2025';
const quantites = ['faible', 'normal', 'beaucoup'] as const;
const periodes = ['precoce', 'normal', 'retard'] as const;
const calibrages = ['court', 'normal', 'long'] as const;
const ageMax = 100;
// Mois de la campagne, dans l'ordre d'affichage : une colonne par mois dans la liste (comme le tableau de bord).
const moisCampagne = [8, 9, 10, 11, 12, 1, 2] as const;

const villagesConnus = communesAvecVillages().flatMap((commune) =>
  commune.villages.map((village) => ({ id: village.id, nom: village.nom, communeId: commune.id, communeNom: commune.nom })),
);
const villageDe = (identifiant: string) => villagesConnus.find((village) => village.id === identifiant);

// Jeu de départ : les identités (fixes) et la couche locale de chacun (modifiée par les enregistrements).
function construireJeu(): { readonly identites: readonly Identite[]; readonly programmes: Map<string, Programme> } {
  const resultat: Identite[] = [];
  const initiaux = new Map<string, Programme>();
  const cooperatives = listerCooperatives();
  const ajouter = (village: string, cooperative?: string) => {
    const numero = resultat.length + 1;
    const prenom = prenoms[(numero * 5) % prenoms.length];
    const id = `prd-${String(numero).padStart(4, '0')}`;
    resultat.push({
      id,
      code: `PRD-${String(numero).padStart(4, '0')}`,
      nom: nomsDeFamille[(numero * 7) % nomsDeFamille.length],
      prenom: prenom.nom,
      genre: prenom.genre,
      village,
      numero,
    });
    if (cooperative) {
      initiaux.set(id, {
        cooperative,
        pieds: 150 + ((numero * 37) % 700),
        ageMoyen: 2 + ((numero * 3) % 9) + (numero % 2) * 0.5,
        statut: numero % 100 < partSuiviActif ? 'suivi-actif' : 'recense',
      });
    }
  };
  for (const cooperative of cooperatives) {
    const villages = communesAvecVillages().find((commune) => commune.id === cooperative.commune)?.villages ?? [];
    for (let i = 0; i < cooperative.producteurs; i++) {
      ajouter(villages[i % villages.length].id, cooperative.id);
    }
  }
  for (let i = 0; i < producteursSansCoucheLocale; i++) {
    ajouter(villagesConnus[(i * 5) % villagesConnus.length].id);
  }
  return { identites: resultat, programmes: initiaux };
}

const jeu = construireJeu();
const identites = jeu.identites;
let programmes = jeu.programmes;
// Les producteurs suivis au départ gardent leur historique, même si leur statut change ensuite.
const suivisAuDepart = new Set([...jeu.programmes].filter(([, programme]) => programme.statut === 'suivi-actif').map(([id]) => id));

interface SaisieStockee {
  readonly id: string;
  readonly parcelle: string;
  readonly date: string; // jour calendaire ISO
  readonly fleurs: number;
}

// Un producteur a une ou plusieurs parcelles (CDC §8.4, règle 3) ; leur code est le même dans toutes les vues.
const nombreParcelles = (identite: Identite) => 1 + (identite.numero % 3);
const identifiantParcelle = (identite: Identite, rang: number) => `${identite.id}-p${rang}`;
const codeParcelle = (identite: Identite, rang: number) => `PAR-${String(identite.numero).padStart(4, '0')}-${rang}`;

let compteurSaisies = 0;
const nouvelIdentifiantSaisie = () => `sai-${++compteurSaisies}`;

// De 1 à 4 saisies par parcelle des producteurs suivis, entre le 1er septembre et fin octobre 2026.
function construireSaisies(): Map<string, SaisieStockee[]> {
  const resultat = new Map<string, SaisieStockee[]>();
  for (const identite of identites) {
    if (!suivisAuDepart.has(identite.id)) {
      continue;
    }
    const saisies: SaisieStockee[] = [];
    for (let rang = 1; rang <= nombreParcelles(identite); rang++) {
      const nombre = 1 + ((identite.numero + rang) % 4);
      for (let k = 0; k < nombre; k++) {
        const jour = (identite.numero * 3 + rang * 11 + k * 13) % 55;
        saisies.push({
          id: nouvelIdentifiantSaisie(),
          parcelle: identifiantParcelle(identite, rang),
          date: new Date(Date.UTC(2026, 8, 1 + jour)).toISOString().slice(0, 10),
          fleurs: 8 + ((identite.numero * 7 + rang * 5 + k * 17) % 113),
        });
      }
    }
    resultat.set(identite.id, saisies);
  }
  return resultat;
}

let saisiesParProducteur = construireSaisies();
const saisiesDe = (identifiant: string): readonly SaisieStockee[] => saisiesParProducteur.get(identifiant) ?? [];

// Total des fleurs et jour de la dernière saisie d'un ensemble de saisies (0 et null s'il n'y en a pas).
function totalEtDerniere(saisies: readonly SaisieStockee[]): { fleurs: number; derniereSaisie: string | null } {
  return {
    fleurs: saisies.reduce((somme, saisie) => somme + saisie.fleurs, 0),
    derniereSaisie: saisies.reduce<string | null>((derniere, saisie) => (!derniere || saisie.date > derniere ? saisie.date : derniere), null),
  };
}

const reponse = <T>(corps: T) => reponseMock(corps, delaiSimuleMs);
const refus = (status: number) => refusMock(status, urlProducteurs, delaiSimuleMs);

// Minimisation des données (CDC §11) : seuls le Super Administrateur et l'Utilisateur voient l'identité complète.
export function identiteComplete(profil: string | undefined): boolean {
  return profil === 'super-administrateur' || profil === 'utilisateur';
}

const initiale = (texte: string) => `${texte.charAt(0)}.`;

// Nom et prénom(s) tels que le serveur les accorde au profil : complets, ou réduits à leurs initiales.
export function nomAffiche(identite: { readonly nom: string; readonly prenom: string }, complete: boolean): string {
  return complete ? `${identite.nom} ${identite.prenom}` : `${initiale(identite.nom)} ${initiale(identite.prenom)}`;
}

// Fleurs saisies chaque mois de la campagne (le mois d'une saisie se lit dans son jour calendaire).
function fleursParMois(saisies: readonly SaisieStockee[]): number[] {
  return moisCampagne.map((mois) =>
    saisies.filter((saisie) => Number(saisie.date.slice(5, 7)) === mois).reduce((somme, saisie) => somme + saisie.fleurs, 0),
  );
}

function ligneDe(identite: Identite, complete: boolean): LigneProducteur {
  const programme = programmes.get(identite.id);
  const saisies = saisiesDe(identite.id);
  return {
    id: identite.id,
    nom: nomAffiche(identite, complete),
    village: villageDe(identite.village)?.nom ?? '–',
    zone: zoneDuVillage(identite.village),
    pieds: programme?.pieds ?? null,
    ageMoyen: programme?.ageMoyen ?? null,
    fleursParMois: fleursParMois(saisies),
    ...totalEtDerniere(saisies),
  };
}

// Producteurs qui correspondent à la recherche (nom et prénom(s) ; un profil dont l'identité est réduite ne cherche que sur
// le code et le village) et à la zone choisie, par ordre alphabétique.
function correspondantsDe(parametres: HttpParams, complete: boolean): Identite[] {
  const recherche = (parametres.get('recherche') ?? '').toLowerCase();
  const zone = parametres.get('zone');
  return identites
    .filter((identite) => {
      const lieu = villageDe(identite.village);
      const texte = complete ? `${identite.nom} ${identite.prenom}` : `${identite.code} ${lieu?.nom} ${lieu?.communeNom}`;
      return (!recherche || texte.toLowerCase().includes(recherche)) && (!zone || zoneDuVillage(identite.village) === zone);
    })
    .sort((a, b) => `${a.nom} ${a.prenom} ${a.code}`.localeCompare(`${b.nom} ${b.prenom} ${b.code}`, 'fr'));
}

interface Droits {
  readonly peutSaisir: boolean;
  readonly peutExporter: boolean;
}

function construireListe(parametres: HttpParams, complete: boolean, droits: Droits, langue: LangueDocument): Producteurs {
  const page = Number(parametres.get('page') ?? 1);
  const taille = Number(parametres.get('taille') ?? 20);
  const correspondants = correspondantsDe(parametres, complete);

  return {
    peutSaisir: droits.peutSaisir,
    peutExporter: droits.peutExporter,
    identiteComplete: complete,
    zones: zonesLocalisees(langue),
    mois: moisCampagne,
    producteurs: {
      total: correspondants.length,
      lignes: correspondants.slice((page - 1) * taille, page * taille).map((identite) => ligneDe(identite, complete)),
    },
  };
}

const textesExport = {
  fr: {
    entetes: ['N°', 'Nom', 'Fokontany', 'Zone', 'Pieds', 'Âge', 'Total'],
    titrePdf: (campagne: string) => `Producteurs - campagne ${campagne}`,
    notePdf: (lignes: number) => `Brouillon de test : seules les ${lignes} premières lignes tiennent sur la page.`,
  },
  en: {
    entetes: ['No.', 'Name', 'Village', 'Zone', 'Trees', 'Age', 'Total'],
    titrePdf: (campagne: string) => `Farmers - campaign ${campagne}`,
    notePdf: (lignes: number) => `Test draft: only the first ${lignes} rows fit on the page.`,
  },
} as const;
const lignesParPagePdf = 38;

// Fichier de la liste affichée. Excel n'est pas fabriqué par le mock : le CSV est renvoyé dans les deux cas ; le PDF
// n'a qu'une page de texte.
function construireExport(parametres: HttpParams, complete: boolean, langue: LangueDocument): { corps: Blob; nom: string } | undefined {
  const format = parametres.get('format');
  if (format !== 'xlsx' && format !== 'pdf') {
    return undefined;
  }
  const t = textesExport[langue];
  const zones = zonesLocalisees(langue);
  const lignes = correspondantsDe(parametres, complete).map((identite, rang) => {
    const ligne = ligneDe(identite, complete);
    return {
      numero: String(rang + 1),
      nom: ligne.nom,
      village: ligne.village,
      zone: zones.find((zone) => zone.id === ligne.zone)?.nom ?? '',
      pieds: ligne.pieds === null ? '' : String(ligne.pieds),
      age: ligne.ageMoyen === null ? '' : String(ligne.ageMoyen),
      mois: ligne.fleursParMois,
      total: ligne.fleurs,
    };
  });

  if (format === 'pdf') {
    const affichees = lignes.slice(0, lignesParPagePdf);
    const texte = [
      t.titrePdf(campagneEnCours),
      '',
      ...affichees.map((ligne) => [ligne.numero, ligne.nom, ligne.village, ligne.zone, ligne.total].filter((c) => c !== '').join(' | ')),
      ...(lignes.length > affichees.length ? ['', t.notePdf(affichees.length)] : []),
    ];
    return { corps: construirePdfTexteMock(texte), nom: `producteurs_${campagneEnCours}.pdf` };
  }
  const entete = [...t.entetes.slice(0, 6), ...moisCampagne.map((mois) => nomMois(langue, mois, 'short')), t.entetes[6]];
  const corps = construireCsvMock(
    [
      entete,
      ...lignes.map((ligne) => [ligne.numero, ligne.nom, ligne.village, ligne.zone, ligne.pieds, ligne.age, ...ligne.mois.map(String), String(ligne.total)]),
    ],
    langue === 'fr' ? ';' : ',',
  );
  return { corps, nom: `producteurs_${campagneEnCours}.csv` };
}

// Toutes les parcelles, par village : le serveur les joint au référentiel géographique (arborescence, résumé, CDC §8.2).
// Les parcelles ne changent pas quand le statut d'un producteur change : le résultat est calculé une seule fois.
let parcellesDesVillages: ReadonlyMap<string, readonly { readonly id: string; readonly code: string }[]> | undefined;

export function parcellesParVillage(): ReadonlyMap<string, readonly { readonly id: string; readonly code: string }[]> {
  if (!parcellesDesVillages) {
    const resultat = new Map<string, { id: string; code: string }[]>();
    for (const identite of identites) {
      const liste = resultat.get(identite.village) ?? [];
      for (let rang = 1; rang <= nombreParcelles(identite); rang++) {
        liste.push({ id: identifiantParcelle(identite, rang), code: codeParcelle(identite, rang) });
      }
      resultat.set(identite.village, liste);
    }
    parcellesDesVillages = resultat;
  }
  return parcellesDesVillages;
}

// Les producteurs tels que les formulaires les proposent, par ordre alphabétique (aussi utilisés par le référentiel des parcelles).
export function choixProducteurs(complete: boolean): ChoixProducteur[] {
  return [...identites]
    .sort((a, b) => `${a.nom} ${a.prenom} ${a.code}`.localeCompare(`${b.nom} ${b.prenom} ${b.code}`, 'fr'))
    .map((identite) => ({
      id: identite.id,
      nom: nomAffiche(identite, complete),
      village: villageDe(identite.village)?.nom ?? '–',
    }));
}

export function producteurParId(
  id: string,
): { readonly id: string; readonly nom: string; readonly prenom: string; readonly village: string } | undefined {
  return identites.find((identite) => identite.id === id);
}

export interface ParcelleDeBase {
  readonly id: string;
  readonly code: string;
  readonly producteur: string; // identifiant du producteur
  readonly cooperative: string; // identifiant de la coopérative
  readonly pieds: number;
}

// Les parcelles de départ du référentiel des parcelles : celles des producteurs qui ont une coopérative (un producteur
// « à compléter » n'en a pas), avec leurs identifiant et code déjà utilisés par la fiche producteur et la saisie de floraison.
// Les pieds du producteur se répartissent entre ses parcelles. Calculées d'après l'état courant des programmes.
export function parcellesDeBase(): ParcelleDeBase[] {
  return identites.flatMap((identite) => {
    const programme = programmes.get(identite.id);
    if (!programme) {
      return [];
    }
    const nombre = nombreParcelles(identite);
    return Array.from({ length: nombre }, (_, indice) => ({
      id: identifiantParcelle(identite, indice + 1),
      code: codeParcelle(identite, indice + 1),
      producteur: identite.id,
      cooperative: programme.cooperative,
      pieds: Math.max(1, Math.round(programme.pieds / nombre)),
    }));
  });
}

// Une parcelle est dans le village de son producteur : elle prend la zone de ce village.
function parcellesDe(identite: Identite): ParcelleProducteur[] {
  return Array.from({ length: nombreParcelles(identite) }, (_, indice) => {
    const id = identifiantParcelle(identite, indice + 1);
    return {
      id,
      libelle: codeParcelle(identite, indice + 1),
      zone: zoneDuVillage(identite.village),
      ...totalEtDerniere(saisiesDe(identite.id).filter((saisie) => saisie.parcelle === id)),
    };
  });
}

// Historique des observations de floraison : seuls les producteurs suivis en ont (CDC §8.10).
function observationsDe(identite: Identite): ObservationProducteur[] {
  if (!suivisAuDepart.has(identite.id)) {
    return [];
  }
  const observation = (campagne: string, annee: number, rang: number, enAttente: boolean): ObservationProducteur => ({
    id: `${identite.id}-${campagne}-${rang}`,
    campagne,
    date: `${annee}-09-${String(4 + rang * 6).padStart(2, '0')}`,
    quantite: quantites[(identite.numero + rang) % quantites.length],
    periode: periodes[(identite.numero * 2 + rang) % periodes.length],
    calibrage: rang >= 1 ? calibrages[(identite.numero + rang) % calibrages.length] : null,
    statutValidation: enAttente ? 'en-attente' : 'valide',
  });
  const courante = Array.from({ length: 2 + (identite.numero % 4) }, (_, rang) =>
    observation(campagneEnCours, 2026, rang, (identite.numero + rang) % 6 === 0),
  );
  const precedente = Array.from({ length: 3 + (identite.numero % 3) }, (_, rang) =>
    observation(campagnePrecedente, 2025, rang, false),
  );
  return [...courante, ...precedente].sort((a, b) => b.date.localeCompare(a.date));
}

function construireFiche(identite: Identite, complete: boolean, administrateur: boolean, langue: 'fr' | 'en'): FicheProducteur {
  const lieu = villageDe(identite.village);
  const programme = programmes.get(identite.id);
  const zone = zoneDuVillage(identite.village);
  const valeurs: ProgrammeProducteur = {
    cooperative: programme?.cooperative ?? null,
    zone: zonesLocalisees(langue).find((candidate) => candidate.id === zone)?.nom ?? null,
    pieds: programme?.pieds ?? null,
    ageMoyen: programme?.ageMoyen ?? null,
    statut: programme?.statut ?? null,
  };
  return {
    id: identite.id,
    peutParametrer: administrateur,
    peutSaisir: administrateur,
    identiteComplete: complete,
    identite: {
      code: identite.code,
      nom: complete ? identite.nom : initiale(identite.nom),
      prenom: complete ? identite.prenom : initiale(identite.prenom),
      genre: complete ? identite.genre : null,
      village: lieu?.nom ?? '–',
      commune: lieu?.communeNom ?? '–',
    },
    programme: valeurs,
    cooperatives: listerCooperatives().map(({ id, nom }) => ({ id, nom })),
    zones: zonesLocalisees(langue),
    parcelles: parcellesDe(identite),
    observations: observationsDe(identite),
  };
}

// Le serveur revalide tout : coopérative connue, pieds entier positif, âge moyen entre 0 et 100 ans, statut valide.
function programmeValide(corps: Partial<DonneesProgramme> | null): corps is DonneesProgramme {
  return (
    !!corps &&
    listerCooperatives().some((cooperative) => cooperative.id === corps.cooperative) &&
    Number.isInteger(corps.pieds) &&
    (corps.pieds as number) >= 0 &&
    typeof corps.ageMoyen === 'number' &&
    Number.isFinite(corps.ageMoyen) &&
    corps.ageMoyen >= 0 &&
    corps.ageMoyen <= ageMax &&
    (corps.statut === 'suivi-actif' || corps.statut === 'recense')
  );
}

function enregistrer(identite: Identite, corps: Partial<DonneesProgramme> | null): Observable<HttpEvent<unknown>> {
  if (!programmeValide(corps)) {
    return refus(422);
  }
  programmes = new Map(programmes).set(identite.id, { ...corps });
  return reponse(null);
}

// Le serveur revalide tout : jour calendaire valide, parcelle du producteur, nombre de fleurs entier supérieur à 0.
function saisieValide(identite: Identite, corps: Partial<SaisieFloraison> | null): corps is SaisieFloraison {
  const parcellesDuProducteur = Array.from({ length: nombreParcelles(identite) }, (_, i) => identifiantParcelle(identite, i + 1));
  return (
    !!corps &&
    typeof corps.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(corps.date) &&
    new Date(`${corps.date}T00:00:00Z`).toISOString().slice(0, 10) === corps.date &&
    typeof corps.parcelle === 'string' &&
    parcellesDuProducteur.includes(corps.parcelle) &&
    Number.isInteger(corps.fleurs) &&
    (corps.fleurs as number) > 0
  );
}

function enregistrerSaisie(identite: Identite, corps: Partial<SaisieFloraison> | null): Observable<HttpEvent<unknown>> {
  if (!saisieValide(identite, corps)) {
    return refus(422);
  }
  const saisie: SaisieStockee = { id: nouvelIdentifiantSaisie(), parcelle: corps.parcelle, date: corps.date, fleurs: corps.fleurs };
  saisiesParProducteur = new Map(saisiesParProducteur).set(identite.id, [...saisiesDe(identite.id), saisie]);
  return reponse(null);
}

// Joue le rôle du serveur pour /floraison/producteurs. Tout est réservé au Super Administrateur : 403 sinon.
function gererFloraison(requete: HttpRequest<unknown>, suivant: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const [, id, action] = requete.url.slice(urlFloraison.length).split('/').map(decodeURIComponent);
  if (profilDeRequete(requete) !== 'super-administrateur') {
    return refus(403);
  }
  if (requete.method === 'GET' && !id) {
    return reponse(choixProducteurs(true));
  }
  const identite = identites.find((candidat) => candidat.id === id);
  if (!identite) {
    return refus(404);
  }
  if (requete.method === 'GET' && !action) {
    const corps: FloraisonProducteur = {
      parcelles: Array.from({ length: nombreParcelles(identite) }, (_, i) => ({
        id: identifiantParcelle(identite, i + 1),
        code: codeParcelle(identite, i + 1),
      })),
      saisies: [...saisiesDe(identite.id)]
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
        .map(({ id: identifiant, date, fleurs }) => ({ id: identifiant, date, fleurs })),
    };
    return reponse(corps);
  }
  if (requete.method === 'POST' && action === 'saisies') {
    return enregistrerSaisie(identite, requete.body as Partial<SaisieFloraison> | null);
  }
  return suivant(requete);
}

// Joue le rôle du serveur pour /referentiels/producteurs. Le programme n'est modifiable que par le Super Administrateur
// (403 sinon, quel que soit ce que la page affiche) ; aucun producteur ne se crée ni ne se supprime (405).
export const producteursMockInterceptor: HttpInterceptorFn = (requete, suivant) => {
  if (requete.url.startsWith(urlFloraison)) {
    return gererFloraison(requete, suivant);
  }
  if (!requete.url.startsWith(urlProducteurs)) {
    return suivant(requete);
  }
  const [, id, action] = requete.url.slice(urlProducteurs.length).split('/').map(decodeURIComponent);
  const profil = profilDeRequete(requete);
  const complete = identiteComplete(profil);
  const langue = requete.params.get('langue') === 'en' ? 'en' : 'fr';
  const peutExporter = profil === 'super-administrateur' || profil === 'utilisateur';

  if (requete.method === 'GET' && !id) {
    return reponse(construireListe(requete.params, complete, { peutSaisir: profil === 'super-administrateur', peutExporter }, langue));
  }
  if (requete.method === 'GET' && id === 'export' && !action) {
    if (!peutExporter) {
      return refus(403);
    }
    const fichier = construireExport(requete.params, complete, langue);
    return fichier ? reponseMock(fichier.corps, delaiSimuleMs, fichier.nom) : refus(422);
  }
  const identite = identites.find((candidat) => candidat.id === id);
  if (requete.method === 'GET' && id && !action) {
    return identite ? reponse(construireFiche(identite, complete, profil === 'super-administrateur', langue)) : refus(404);
  }
  if (requete.method === 'PUT' && id && action === 'programme') {
    if (profil !== 'super-administrateur') {
      return refus(403);
    }
    return identite ? enregistrer(identite, requete.body as Partial<DonneesProgramme> | null) : refus(404);
  }
  if (requete.method === 'POST' || requete.method === 'DELETE') {
    return refus(405);
  }
  return suivant(requete);
};
