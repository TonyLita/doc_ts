import { HttpEvent, HttpInterceptorFn, HttpParams, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AffectationZone,
  ArbreGeographique,
  ReferentielVillages,
  Village,
} from '../features/referentiel-geo/data-access/referentiel-geo.modeles';
import { urlArbre, urlVillages } from '../features/referentiel-geo/data-access/referentiel-externe.service';
import { urlZonesVillages } from '../features/referentiel-geo/data-access/zones-villages.service';
import { delaiSimuleMs } from './connexion-mock.interceptor';
import {
  communes,
  ecrireZones,
  villageExiste,
  villages,
  zoneDuVillage,
  zoneExiste,
  zones,
  zonesLocalisees,
} from './geographie-mock';
import { parcellesParVillage } from './producteurs-mock';
import { profilDeRequete } from './profil-mock';
import { refusMock, reponseMock } from './reponses-mock';
import { construireTableauDeBordMock } from './tableau-de-bord-mock';

// DONNÉES DE TEST du référentiel géographique (CDC §8.2). Même statut temporaire que comptes-mock.ts.
// Communes, villages et rattachement village → zone vivent dans geographie-mock.ts ; les parcelles viennent des
// producteurs de test (producteurs-mock.ts) : la zone d'une parcelle est celle de son village.
// Passer `sourceDisponible` à false simule une API externe en panne (le serveur sert alors son dernier jeu connu).
const sourceDisponible = true;

const reponse = <T>(corps: T) => reponseMock(corps, delaiSimuleMs);
const refus = (status: number) => refusMock(status, urlZonesVillages, delaiSimuleMs);

const nombreParcelles = (identifiantVillage: string) => parcellesParVillage().get(identifiantVillage)?.length ?? 0;
const sommeParcelles = (identifiants: readonly string[]) =>
  identifiants.reduce((somme, identifiant) => somme + nombreParcelles(identifiant), 0);

function construireReponse(parametres: HttpParams, peutParametrer: boolean): ReferentielVillages {
  const langue = parametres.get('langue') === 'en' ? 'en' : 'fr';
  const commune = communes.find((candidate) => candidate.id === parametres.get('commune'));
  const zone = parametres.get('zone');
  const sansZone = parametres.get('sansZone') === 'true';
  const recherche = (parametres.get('recherche') ?? '').toLowerCase();
  const page = Number(parametres.get('page') ?? 1);
  const taille = Number(parametres.get('taille') ?? 20);

  const tous: Village[] = villages.map((village) => ({
    id: village.id,
    nom: village.nom,
    commune: village.commune,
    zone: zoneDuVillage(village.id),
  }));
  const correspondants = tous
    .filter((village) => !commune || village.commune === commune.nom)
    .filter((village) => (sansZone ? village.zone === null : !zone || village.zone === zone))
    .filter((village) => !recherche || `${village.nom} ${village.commune}`.toLowerCase().includes(recherche));
  const identifiantsSansZone = tous.filter((village) => village.zone === null).map((village) => village.id);

  return {
    peutParametrer,
    sourceDisponible,
    derniereSynchronisation: construireTableauDeBordMock({}).derniereSynchronisation,
    zones: zonesLocalisees(langue),
    communes: communes.map(({ id, nom }) => ({ id, nom })),
    // Les compteurs décrivent tout le référentiel : ils ignorent les filtres.
    compteurs: {
      communes: communes.length,
      total: tous.length,
      parcelles: sommeParcelles(tous.map((village) => village.id)),
      sansZone: identifiantsSansZone.length,
      parcellesSansZone: sommeParcelles(identifiantsSansZone),
      parZone: zones.map((candidate) => {
        const duZone = tous.filter((village) => village.zone === candidate.id).map((village) => village.id);
        return { zone: candidate.id, villages: duZone.length, parcelles: sommeParcelles(duZone) };
      }),
    },
    villages: {
      total: correspondants.length,
      lignes: correspondants.slice((page - 1) * taille, page * taille),
    },
  };
}

// La hiérarchie complète, avec les parcelles de chaque village : des codes seulement, jamais d'identité de producteur.
function construireArbre(parametres: HttpParams): ArbreGeographique {
  const langue = parametres.get('langue') === 'en' ? 'en' : 'fr';
  return {
    zones: zonesLocalisees(langue),
    communes: communes.map((commune) => ({
      id: commune.id,
      nom: commune.nom,
      villages: villages
        .filter((village) => village.communeId === commune.id)
        .map((village) => ({
          id: village.id,
          nom: village.nom,
          zone: zoneDuVillage(village.id),
          parcelles: parcellesParVillage().get(village.id) ?? [],
        })),
    })),
  };
}

// Valide tout le lot avant d'écrire quoi que ce soit : un lot refusé ne change rien.
function affecter(corps: { readonly affectations?: readonly AffectationZone[] } | null): Observable<HttpEvent<unknown>> {
  const affectations = corps?.affectations;
  if (!Array.isArray(affectations) || affectations.length === 0) {
    return refus(422);
  }
  const inconnue = affectations.some(
    (affectation) =>
      !villageExiste(affectation.village) || (affectation.zone !== null && !zoneExiste(affectation.zone)),
  );
  if (inconnue) {
    return refus(404);
  }
  ecrireZones(affectations);
  return reponse(null);
}

function estSuperAdministrateur(requete: HttpRequest<unknown>): boolean {
  return profilDeRequete(requete) === 'super-administrateur';
}

// Joue le rôle du serveur pour /referentiels/villages. Le rattachement à une zone n'est accepté que du Super
// Administrateur : 403 sinon, quel que soit ce que la page affiche.
export const referentielGeoMockInterceptor: HttpInterceptorFn = (requete, suivant) => {
  if (requete.method === 'GET' && requete.url === urlVillages) {
    return reponse(construireReponse(requete.params, estSuperAdministrateur(requete)));
  }
  if (requete.method === 'GET' && requete.url === urlArbre) {
    return reponse(construireArbre(requete.params));
  }
  if (requete.method === 'PUT' && requete.url === urlZonesVillages) {
    return estSuperAdministrateur(requete) ? affecter(requete.body as { affectations?: AffectationZone[] }) : refus(403);
  }
  return suivant(requete);
};
