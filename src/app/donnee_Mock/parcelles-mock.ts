import { HttpEvent, HttpInterceptorFn, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DonneesParcelle,
  LigneParcelle,
  Parcelles,
  StatutParcelle,
} from '../features/referentiel-parcelle/data-access/parcelles.modeles';
import { urlParcelles } from '../features/referentiel-parcelle/data-access/parcelles.service';
import { creerHasard, kilosParPied } from './cartographie-mock';
import { delaiSimuleMs } from './connexion-mock.interceptor';
import { listerCooperatives } from './cooperatives-mock';
import { villages, zoneDuVillage, zonesLocalisees } from './geographie-mock';
import {
  choixProducteurs,
  identiteComplete,
  nomAffiche,
  parcellesDeBase,
  producteurParId,
} from './producteurs-mock';
import { profilDeRequete } from './profil-mock';
import { refusMock, reponseMock } from './reponses-mock';

// DONNÉES DE TEST du référentiel des parcelles (CDC §8.5). Même statut temporaire que comptes-mock.ts.
// Les parcelles partent de celles des producteurs de test (mêmes identifiants, mêmes codes, même zone par le village que
// la fiche producteur) ; leurs coordonnées sont fabriquées autour du centre de leur commune, sans aléatoire. Les
// modifications, créations et archivages vivent en mémoire jusqu'au rechargement de la page. La cartographie et la page
// des coopératives gardent leurs propres jeux de parcelles : leurs totaux diffèrent. Une parcelle créée ici n'apparaît pas
// dans la fiche producteur.
interface ParcelleStockee {
  readonly id: string;
  readonly code: string;
  readonly producteur: string; // identifiant du producteur
  readonly cooperative: string; // identifiant de la coopérative
  readonly latitude: number;
  readonly longitude: number;
  readonly pieds: number;
  readonly vanille: boolean;
  readonly archivee: boolean;
}

// Centres approximatifs des communes du référentiel géographique de test (latitude, longitude), propres à ce faux serveur.
const centresCommunes: Readonly<Record<string, readonly [number, number]>> = {
  sambava: [-14.27, 50.17],
  antalaha: [-14.9, 50.28],
  andapa: [-14.65, 49.65],
  maroantsetra: [-15.43, 49.74],
  'mananara-nord': [-16.17, 49.77],
  ambanja: [-13.68, 48.45],
  ambilobe: [-13.2, 49.05],
};
const dispersionDegres = 0.15;
const partVanille = 0.85;
const unArchiveeSur = 40;

const arrondi = (valeur: number): number => Math.round(valeur * 1e5) / 1e5;

function construireJeu(): ParcelleStockee[] {
  const hasard = creerHasard(5);
  return parcellesDeBase().map((base, indice) => {
    const communeId = villages.find((village) => village.id === producteurParId(base.producteur)?.village)?.communeId;
    const [latitude, longitude] = centresCommunes[communeId ?? ''] ?? centresCommunes['sambava'];
    return {
      ...base,
      latitude: arrondi(latitude + (hasard() - 0.5) * 2 * dispersionDegres),
      longitude: arrondi(longitude + (hasard() - 0.5) * 2 * dispersionDegres),
      vanille: hasard() < partVanille,
      archivee: indice % unArchiveeSur === unArchiveeSur - 1,
    };
  });
}

// Le jeu se construit au premier appel : il lit alors l'état courant des producteurs.
let parcelles: readonly ParcelleStockee[] | undefined;
const etat = (): readonly ParcelleStockee[] => (parcelles ??= construireJeu());

const reponse = <T>(corps: T) => reponseMock(corps, delaiSimuleMs);
const refus = (status: number) => refusMock(status, urlParcelles, delaiSimuleMs);

function ligne(parcelle: ParcelleStockee, complete: boolean, langue: 'fr' | 'en'): LigneParcelle {
  const producteur = producteurParId(parcelle.producteur);
  const idZone = producteur ? zoneDuVillage(producteur.village) : null;
  return {
    id: parcelle.id,
    code: parcelle.code,
    producteurId: parcelle.producteur,
    producteur: producteur ? nomAffiche(producteur, complete) : '–',
    cooperativeId: parcelle.cooperative,
    cooperative: listerCooperatives().find((cooperative) => cooperative.id === parcelle.cooperative)?.nom ?? '–',
    latitude: parcelle.latitude,
    longitude: parcelle.longitude,
    pieds: parcelle.pieds,
    productionKg: Math.round(parcelle.pieds * kilosParPied),
    zone: zonesLocalisees(langue).find((zone) => zone.id === idZone)?.nom ?? null,
    vanille: parcelle.vanille,
    archivee: parcelle.archivee,
  };
}

// Recherche sur le code et, pour un profil qui voit l'identité, sur le nom du producteur.
function construireListe(parametres: HttpParams, complete: boolean, peutAdministrer: boolean): Parcelles {
  const recherche = (parametres.get('recherche') ?? '').toLowerCase();
  const cooperative = parametres.get('cooperative');
  const zone = parametres.get('zone');
  const statut = parametres.get('statut') as StatutParcelle | null;
  const page = Number(parametres.get('page') ?? 1);
  const taille = Number(parametres.get('taille') ?? 20);
  const langue = parametres.get('langue') === 'en' ? 'en' : 'fr';

  const correspondantes = etat()
    .filter((parcelle) => {
      const producteur = producteurParId(parcelle.producteur);
      const texte = complete && producteur ? `${parcelle.code} ${producteur.nom} ${producteur.prenom}` : parcelle.code;
      return (
        (!recherche || texte.toLowerCase().includes(recherche)) &&
        (!cooperative || parcelle.cooperative === cooperative) &&
        (!zone || (producteur !== undefined && zoneDuVillage(producteur.village) === zone)) &&
        (!statut || parcelle.archivee === (statut === 'archivee'))
      );
    })
    .sort((a, b) => a.code.localeCompare(b.code, 'fr'));

  return {
    peutAdministrer,
    identiteComplete: complete,
    cooperatives: listerCooperatives().map(({ id, nom }) => ({ id, nom })),
    zones: zonesLocalisees(langue),
    producteurs: peutAdministrer ? choixProducteurs(true) : [],
    synthese: {
      parcelles: correspondantes.length,
      enVanille: correspondantes.filter((parcelle) => parcelle.vanille).length,
      productionKg: correspondantes.reduce((somme, parcelle) => somme + Math.round(parcelle.pieds * kilosParPied), 0),
    },
    parcelles: {
      total: correspondantes.length,
      lignes: correspondantes.slice((page - 1) * taille, page * taille).map((parcelle) => ligne(parcelle, complete, langue)),
    },
  };
}

const nombreDans = (valeur: unknown, minimum: number, maximum: number): valeur is number =>
  typeof valeur === 'number' && Number.isFinite(valeur) && valeur >= minimum && valeur <= maximum;

// Le serveur revalide tout : producteur et coopérative connus, coordonnées dans leurs bornes, pieds entier supérieur ou
// égal à 0, indicateur de vanille booléen. Renvoie le statut de refus, ou undefined si les données sont acceptables.
function refusDeDonnees(donnees: Partial<DonneesParcelle> | null): number | undefined {
  const valide =
    donnees !== null &&
    typeof donnees.producteur === 'string' &&
    producteurParId(donnees.producteur) !== undefined &&
    listerCooperatives().some((cooperative) => cooperative.id === donnees.cooperative) &&
    nombreDans(donnees.latitude, -90, 90) &&
    nombreDans(donnees.longitude, -180, 180) &&
    Number.isInteger(donnees.pieds) &&
    (donnees.pieds as number) >= 0 &&
    typeof donnees.vanille === 'boolean';
  return valide ? undefined : 422;
}

// Le code et l'identifiant suivent la numérotation des parcelles d'un producteur : le rang suivant est libre.
function creer(corps: Partial<DonneesParcelle> | null): Observable<HttpEvent<unknown>> {
  const statut = refusDeDonnees(corps);
  if (statut || !corps) {
    return refus(statut ?? 422);
  }
  const donnees = corps as DonneesParcelle;
  const numeroProducteur = donnees.producteur.replace('prd-', '');
  let rang = etat().filter((parcelle) => parcelle.producteur === donnees.producteur).length + 1;
  while (etat().some((parcelle) => parcelle.id === `${donnees.producteur}-p${rang}`)) {
    rang++;
  }
  parcelles = [
    ...etat(),
    { ...donnees, id: `${donnees.producteur}-p${rang}`, code: `PAR-${numeroProducteur}-${rang}`, archivee: false },
  ];
  return reponse(null);
}

function modifier(id: string, corps: Partial<DonneesParcelle> | null): Observable<HttpEvent<unknown>> {
  if (!etat().some((parcelle) => parcelle.id === id)) {
    return refus(404);
  }
  const statut = refusDeDonnees(corps);
  if (statut || !corps) {
    return refus(statut ?? 422);
  }
  parcelles = etat().map((parcelle) => (parcelle.id === id ? { ...parcelle, ...(corps as DonneesParcelle) } : parcelle));
  return reponse(null);
}

function archiver(id: string, corps: { readonly archivee?: unknown } | null): Observable<HttpEvent<unknown>> {
  if (!etat().some((parcelle) => parcelle.id === id)) {
    return refus(404);
  }
  if (typeof corps?.archivee !== 'boolean') {
    return refus(422);
  }
  const archivee = corps.archivee;
  parcelles = etat().map((parcelle) => (parcelle.id === id ? { ...parcelle, archivee } : parcelle));
  return reponse(null);
}

// Joue le rôle du serveur pour /referentiels/parcelles. Tout le monde consulte ; l'écriture est réservée au Super
// Administrateur (403 sinon, quel que soit ce que la page affiche) ; une parcelle ne se supprime pas (405).
export const parcellesMockInterceptor: HttpInterceptorFn = (requete, suivant) => {
  if (!requete.url.startsWith(urlParcelles)) {
    return suivant(requete);
  }
  const [, id, action] = requete.url.slice(urlParcelles.length).split('/').map(decodeURIComponent);
  const profil = profilDeRequete(requete);
  const administrateur = profil === 'super-administrateur';

  if (requete.method === 'GET' && !id) {
    return reponse(construireListe(requete.params, identiteComplete(profil), administrateur));
  }
  if (requete.method === 'DELETE') {
    return refus(405);
  }
  if (!administrateur) {
    return refus(403);
  }
  if (requete.method === 'POST' && !id) {
    return creer(requete.body as Partial<DonneesParcelle> | null);
  }
  if (requete.method === 'PUT' && id && !action) {
    return modifier(id, requete.body as Partial<DonneesParcelle> | null);
  }
  if (requete.method === 'PUT' && id && action === 'archivage') {
    return archiver(id, requete.body as { archivee?: unknown } | null);
  }
  return suivant(requete);
};
