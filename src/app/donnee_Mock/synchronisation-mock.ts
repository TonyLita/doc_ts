import { HttpParams } from '@angular/common/http';
import {
  EntreeJournal,
  StatutSynchronisation,
  Synchronisation,
} from '../features/synchronisation/data-access/synchronisation.modeles';
import { construireTableauDeBordMock } from './tableau-de-bord-mock';

// DONNÉES DE TEST du journal de synchronisation (CDC §8.15). Même statut temporaire que comptes-mock.ts.
// La synchronisation la plus récente de la campagne en cours porte la date affichée par le tableau de bord de test.
const heureMs = 3_600_000;
const lettresReferents = ['A', 'B', 'C', 'D'] as const;

// Une origine = un Lead Farmer (mêmes noms que l'échantillonnage de test) ou le technicien d'une coopérative.
const cooperatives = [
  { id: 'coop-sava', nom: 'OP Sava' },
  { id: 'coop-analanjirofo', nom: 'OP Analanjirofo' },
  { id: 'coop-diana', nom: 'OP Diana' },
] as const;

const origines = cooperatives.flatMap((cooperative, indice) => [
  ...lettresReferents.map((lettre) => ({
    nom: `Lead Farmer ${indice + 1}${lettre}`,
    typeOrigine: 'lead-farmer' as const,
    cooperative,
  })),
  { nom: `Technicien ${cooperative.nom}`, typeOrigine: 'technicien' as const, cooperative },
]);

// Nombre d'échanges d'une campagne : la campagne en cours est plus récente, donc moins fournie qu'une campagne finie.
const echangesParCampagne = { courante: 140, precedente: 110 } as const;

function statutDe(i: number): StatutSynchronisation {
  if (i % 13 === 4) {
    return 'erreur';
  }
  return i % 7 === 3 ? 'partiel' : 'succes';
}

// Journal complet d'une campagne, de la plus récente à la plus ancienne, sans aléatoire : le même à chaque démarrage.
function construireJournal(campagne: string, campagneEnCours: string, derniere: string): EntreeJournal[] {
  const courante = campagne === campagneEnCours;
  const fin = courante ? new Date(derniere).getTime() : Date.UTC(Number(campagne) + 1, 1, 20, 16, 30);
  const nombre = courante ? echangesParCampagne.courante : echangesParCampagne.precedente;
  let instant = fin;
  return Array.from({ length: nombre }, (_, i) => {
    const origine = origines[(i * 7) % origines.length];
    const statut = statutDe(i);
    const entree: EntreeJournal = {
      id: `sync-${campagne}-${i + 1}`,
      horodatage: new Date(instant).toISOString(),
      origine: origine.nom,
      typeOrigine: origine.typeOrigine,
      cooperative: origine.cooperative.nom,
      // Un échange en erreur ne transmet aucune fiche ; un échange partiel n'en transmet que quelques-unes.
      enregistrements: statut === 'erreur' ? 0 : statut === 'partiel' ? 3 + ((i * 5) % 12) : 8 + ((i * 11) % 50),
      statut,
    };
    instant -= (5 + ((i * 3) % 9)) * heureMs; // un échange toutes les 5 à 13 heures
    return entree;
  });
}

export function construireSynchronisationMock(parametres: HttpParams): Synchronisation {
  const tableau = construireTableauDeBordMock({});
  const campagne = parametres.get('campagne') ?? tableau.campagneEnCours;
  const cooperative = cooperatives.find((candidate) => candidate.id === parametres.get('cooperative'));
  const statut = parametres.get('statut');
  const page = Number(parametres.get('page') ?? 1);
  const taille = Number(parametres.get('taille') ?? 15);

  const duPerimetre = construireJournal(campagne, tableau.campagneEnCours, tableau.derniereSynchronisation).filter(
    (entree) => !cooperative || entree.cooperative === cooperative.nom,
  );
  const correspondantes = duPerimetre.filter((entree) => !statut || entree.statut === statut);

  return {
    campagne,
    campagneEnCours: tableau.campagneEnCours,
    campagnes: tableau.campagnes,
    cooperatives: tableau.cooperatives,
    // Le résumé ignore le filtre de statut : il donne l'état général de la campagne.
    resume: {
      derniere: duPerimetre[0]?.horodatage ?? null,
      total: duPerimetre.length,
      enregistrements: duPerimetre.reduce((somme, entree) => somme + entree.enregistrements, 0),
      partielles: duPerimetre.filter((entree) => entree.statut === 'partiel').length,
      enErreur: duPerimetre.filter((entree) => entree.statut === 'erreur').length,
    },
    journal: {
      total: correspondantes.length,
      lignes: correspondantes.slice((page - 1) * taille, page * taille),
    },
  };
}
