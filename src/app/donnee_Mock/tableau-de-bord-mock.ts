import { Cooperative } from '../shared/models/cooperative';
import { StatutMois } from '../shared/models/statut-donnees';
import {
  FiltresTableauDeBord,
  TableauDeBord,
} from '../features/dashboard/data-access/tableau-de-bord.modeles';

// DONNÉES DE TEST du tableau de bord (CDC §8.7). Même statut temporaire que comptes-mock.ts.
const campagneEnCours = '2026';
const campagnes = ['2026', '2025'] as const;
const zones = ['Zone côtière', 'Zone de plateau', 'Zone forestière'] as const;
const moisCampagne = [8, 9, 10, 11, 12, 1, 2] as const;

const cooperatives: readonly (Cooperative & { readonly part: number })[] = [
  { id: 'coop-sava', nom: 'OP Sava', part: 0.45 },
  { id: 'coop-analanjirofo', nom: 'OP Analanjirofo', part: 0.35 },
  { id: 'coop-diana', nom: 'OP Diana', part: 0.2 },
];

// Fleurs observées par zone (lignes) et par mois de la campagne (colonnes), toutes coopératives confondues.
const fleursParZoneEtMois: readonly (readonly number[])[] = [
  [1200, 3100, 5400, 7200, 4300, 1500, 600],
  [800, 2200, 4100, 5600, 3300, 1100, 400],
  [500, 1400, 2600, 3900, 2200, 700, 250],
];

const statutsCampagneEnCours: readonly StatutMois[] = [
  { mois: 8, statut: 'complet' },
  { mois: 9, statut: 'complet' },
  { mois: 10, statut: 'complet' },
  { mois: 11, statut: 'partiel' },
  { mois: 12, statut: 'en-attente' },
  { mois: 1, statut: 'en-attente' },
  { mois: 2, statut: 'en-attente' },
];

// Coefficient fleurs → kg : paramètre du serveur (CDC §8.7), valeur fictive ici.
const kilosParFleur = 0.0213;

export function construireTableauDeBordMock(filtres: FiltresTableauDeBord): TableauDeBord {
  const campagne = filtres.campagne ?? campagneEnCours;
  const cooperative = cooperatives.find((candidate) => candidate.id === filtres.cooperative);
  const facteur = (cooperative?.part ?? 1) * (campagne === campagneEnCours ? 1 : 0.85);

  const floraisonMensuelle = moisCampagne.map((mois, indice) => ({
    mois,
    fleursParZone: fleursParZoneEtMois.map((parMois) => Math.round(parMois[indice] * facteur)),
  }));
  const totauxMois = floraisonMensuelle.map((ligne) => ligne.fleursParZone.reduce((a, b) => a + b, 0));
  const totalFleurs = totauxMois.reduce((a, b) => a + b, 0);

  return {
    campagne,
    campagneEnCours,
    campagnes,
    cooperatives: cooperatives.map(({ id, nom }) => ({ id, nom })),
    producteursSuivis: Math.round(412 * facteur),
    tauxCouverture: 78,
    totalFleurs,
    moisPic: moisCampagne[totauxMois.indexOf(Math.max(...totauxMois))],
    productionEstimeeKg: Math.round(totalFleurs * kilosParFleur),
    cooperativesActives: cooperative ? 1 : cooperatives.length,
    tauxSaisiesValides: 91,
    statutsMois:
      campagne === campagneEnCours
        ? statutsCampagneEnCours
        : moisCampagne.map((mois) => ({ mois, statut: 'complet' as const })),
    zones,
    floraisonMensuelle,
    derniereSynchronisation: '2026-10-22T08:14:00.000Z',
  };
}
