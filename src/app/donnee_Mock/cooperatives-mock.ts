import { HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Cooperatives,
  DonneesCooperative,
  FicheCooperative,
} from '../features/referentiel-cooperatives/data-access/cooperatives.modeles';
import { urlCooperatives } from '../features/referentiel-cooperatives/data-access/cooperatives.service';
import { delaiSimuleMs } from './connexion-mock.interceptor';
import { profilDeRequete } from './profil-mock';
import { communesAvecVillages } from './geographie-mock';
import { refusMock, reponseMock } from './reponses-mock';

// DONNÉES DE TEST du référentiel des coopératives (CDC §8.3). Même statut temporaire que comptes-mock.ts.
// Les sept Organisations de Producteurs du dossier de cadrage vivent en mémoire : les actions d'administration les
// modifient jusqu'au rechargement de la page. Les autres pages de test gardent leur propre liste de coopératives :
// créer ou supprimer une OP ici ne change pas leurs filtres. Les effectifs sont calculés par le « serveur »
// d'après les producteurs et les parcelles rattachés : ceux d'une coopérative créée ici démarrent à zéro.
interface CooperativeStockee {
  readonly id: string;
  readonly nom: string;
  readonly commune: string; // identifiant de la commune
  readonly village: string; // identifiant du village pivot
  readonly producteurs: number;
  readonly parcelles: number;
}

const longueurMaxNom = 120;

// Villages pivots pris dans le référentiel géographique de test (mêmes identifiants que le module géographique).
const identifiantVillage = (commune: string, nom: string): string =>
  communesAvecVillages()
    .find((candidate) => candidate.id === commune)
    ?.villages.find((village) => village.nom === nom)?.id ?? '';

let cooperatives: readonly CooperativeStockee[] = [
  { id: 'coop-sava', nom: 'OP Sava', commune: 'sambava', village: identifiantVillage('sambava', 'Sambava'), producteurs: 226, parcelles: 450 },
  { id: 'coop-antalaha', nom: 'OP Antalaha', commune: 'antalaha', village: identifiantVillage('antalaha', 'Antalaha'), producteurs: 118, parcelles: 450 },
  { id: 'coop-andapa', nom: 'OP Andapa', commune: 'andapa', village: identifiantVillage('andapa', 'Andapa'), producteurs: 94, parcelles: 450 },
  { id: 'coop-analanjirofo', nom: 'OP Analanjirofo', commune: 'maroantsetra', village: identifiantVillage('maroantsetra', 'Maroantsetra'), producteurs: 195, parcelles: 310 },
  { id: 'coop-mananara', nom: 'OP Mananara', commune: 'mananara-nord', village: identifiantVillage('mananara-nord', 'Mananara-Nord'), producteurs: 72, parcelles: 190 },
  { id: 'coop-diana', nom: 'OP Diana', commune: 'ambanja', village: identifiantVillage('ambanja', 'Ambanja'), producteurs: 107, parcelles: 280 },
  { id: 'coop-ambilobe', nom: 'OP Ambilobe', commune: 'ambilobe', village: identifiantVillage('ambilobe', 'Ambilobe'), producteurs: 64, parcelles: 160 },
];

// Les coopératives telles que les autres référentiels de test les rattachent (ex. les producteurs, CDC §8.4).
export function listerCooperatives() {
  return cooperatives.map(({ id, nom, commune, producteurs }) => ({ id, nom, commune, producteurs }));
}

const reponse = <T>(corps: T) => reponseMock(corps, delaiSimuleMs);
const refus = (status: number) => refusMock(status, urlCooperatives, delaiSimuleMs);

// Identifiant stable attribué par le « serveur » : « coop- » et le nom sans accent, en minuscules, sans le préfixe « OP ».
function nouvelIdentifiant(nom: string): string {
  const base = nom
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^op-/, '');
  let identifiant = `coop-${base}`;
  for (let numero = 2; cooperatives.some((cooperative) => cooperative.id === identifiant); numero++) {
    identifiant = `coop-${base}-${numero}`;
  }
  return identifiant;
}

function fiche(cooperative: CooperativeStockee): FicheCooperative {
  const commune = communesAvecVillages().find((candidate) => candidate.id === cooperative.commune);
  return {
    id: cooperative.id,
    nom: cooperative.nom,
    villagePivot: commune?.villages.find((village) => village.id === cooperative.village) ?? { id: cooperative.village, nom: '–' },
    commune: { id: cooperative.commune, nom: commune?.nom ?? '–' },
    producteurs: cooperative.producteurs,
    parcelles: cooperative.parcelles,
  };
}

// Le serveur revalide tout : nom présent et unique (sans tenir compte de la casse), commune et village connus,
// village de cette commune. Renvoie le statut de refus, ou undefined si les données sont acceptables.
function refusDeDonnees(donnees: DonneesCooperative | null, sauf?: string): number | undefined {
  const nom = donnees?.nom?.trim();
  const commune = communesAvecVillages().find((candidate) => candidate.id === donnees?.commune);
  if (!nom || nom.length > longueurMaxNom || !commune || !commune.villages.some((village) => village.id === donnees?.village)) {
    return 422;
  }
  const pris = cooperatives.some(
    (cooperative) => cooperative.id !== sauf && cooperative.nom.toLowerCase() === nom.toLowerCase(),
  );
  return pris ? 409 : undefined;
}

function creer(donnees: DonneesCooperative | null): Observable<HttpEvent<unknown>> {
  const statut = refusDeDonnees(donnees);
  if (statut || !donnees) {
    return refus(statut ?? 422);
  }
  const nom = donnees.nom.trim();
  cooperatives = [
    ...cooperatives,
    { id: nouvelIdentifiant(nom), nom, commune: donnees.commune, village: donnees.village, producteurs: 0, parcelles: 0 },
  ];
  return reponse(null);
}

function modifier(id: string, donnees: DonneesCooperative | null): Observable<HttpEvent<unknown>> {
  if (!cooperatives.some((cooperative) => cooperative.id === id)) {
    return refus(404);
  }
  const statut = refusDeDonnees(donnees, id);
  if (statut || !donnees) {
    return refus(statut ?? 422);
  }
  cooperatives = cooperatives.map((cooperative) =>
    cooperative.id === id ? { ...cooperative, nom: donnees.nom.trim(), commune: donnees.commune, village: donnees.village } : cooperative,
  );
  return reponse(null);
}

// Une coopérative à laquelle des producteurs ou des parcelles sont rattachés ne peut pas être supprimée.
function supprimer(id: string): Observable<HttpEvent<unknown>> {
  const cooperative = cooperatives.find((candidate) => candidate.id === id);
  if (!cooperative) {
    return refus(404);
  }
  if (cooperative.producteurs > 0 || cooperative.parcelles > 0) {
    return refus(409);
  }
  cooperatives = cooperatives.filter((candidate) => candidate.id !== id);
  return reponse(null);
}

// Joue le rôle du serveur pour /referentiels/cooperatives. Création, modification et suppression sont refusées (403)
// hors Super Administrateur, quel que soit ce que la page affiche.
export const cooperativesMockInterceptor: HttpInterceptorFn = (requete, suivant) => {
  if (!requete.url.startsWith(urlCooperatives)) {
    return suivant(requete);
  }
  const [, id] = requete.url.slice(urlCooperatives.length).split('/').map(decodeURIComponent);
  const administrateur = profilDeRequete(requete) === 'super-administrateur';

  if (requete.method === 'GET' && !id) {
    const corps: Cooperatives = {
      peutAdministrer: administrateur,
      communes: communesAvecVillages(),
      cooperatives: cooperatives.map(fiche),
    };
    return reponse(corps);
  }
  if (!administrateur) {
    return refus(403);
  }
  if (requete.method === 'POST' && !id) {
    return creer(requete.body as DonneesCooperative | null);
  }
  if (requete.method === 'PUT' && id) {
    return modifier(id, requete.body as DonneesCooperative | null);
  }
  if (requete.method === 'DELETE' && id) {
    return supprimer(id);
  }
  return suivant(requete);
};
