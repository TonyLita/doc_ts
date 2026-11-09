import {
  AnalyseZones,
  FiltresAnalyseZones,
  FleursDuMois,
  ProfilPeriode,
} from '../features/analyse-zones/data-access/analyse-zones.modeles';

// DONNÉES DE TEST de l'analyse par zone (CDC §8.8). Même statut temporaire que comptes-mock.ts.
const campagnes = ['2026', '2025', '2024', '2023'] as const;
const campagneEnCours = campagnes[0];
const moisCampagne = [8, 9, 10, 11, 12, 1, 2] as const;

// Intensité d'une campagne par rapport à la campagne en cours.
const intensiteCampagne: Readonly<Record<string, number>> = { '2026': 1, '2025': 0.9, '2024': 1.1, '2023': 0.8 };

// Part de chaque coopérative dans les saisies (même idée que le mock du tableau de bord).
const cooperatives = [
  { id: 'coop-sava', nom: 'OP Sava', part: 0.45 },
  { id: 'coop-analanjirofo', nom: 'OP Analanjirofo', part: 0.35 },
  { id: 'coop-diana', nom: 'OP Diana', part: 0.2 },
] as const;

// Le pic de floraison arrive d'abord sur le littoral, puis en zone intermédiaire, enfin en haute montagne.
const zones: readonly {
  id: string;
  nom: string;
  producteurs: number;
  profil: ProfilPeriode;
  fleursParMois: readonly number[]; // un chiffre par mois de moisCampagne
}[] = [
  { id: 'littorale', nom: 'Littorale', producteurs: 142, profil: 'precoce', fleursParMois: [2400, 5200, 7600, 4300, 1500, 500, 200] },
  { id: 'intermediaire', nom: 'Intermédiaire', producteurs: 198, profil: 'normal', fleursParMois: [900, 3000, 6200, 8300, 5200, 1900, 500] },
  { id: 'haute-montagne', nom: 'Haute montagne', producteurs: 72, profil: 'retarde', fleursParMois: [200, 800, 1900, 3600, 4900, 3500, 1100] },
];

export function construireAnalyseZonesMock(filtres: FiltresAnalyseZones): AnalyseZones {
  const campagne = filtres.campagne ?? campagneEnCours;
  const part = cooperatives.find((candidate) => candidate.id === filtres.cooperative)?.part ?? 1;
  const mensuel = (fleursParMois: readonly number[], pourCampagne: string): FleursDuMois[] =>
    moisCampagne.map((mois, indice) => ({
      mois,
      fleurs: Math.round(fleursParMois[indice] * part * (intensiteCampagne[pourCampagne] ?? 1)),
    }));
  const total = (fleurs: readonly FleursDuMois[]) => fleurs.reduce((somme, ligne) => somme + ligne.fleurs, 0);

  const zonesCampagne = zones.map((zone) => ({ zone, mensuel: mensuel(zone.fleursParMois, campagne) }));
  const totalRegion = zonesCampagne.reduce((somme, { mensuel: m }) => somme + total(m), 0) || 1;
  const precedentes = campagnes.slice(campagnes.indexOf(campagne as (typeof campagnes)[number]) + 1).reverse();

  return {
    campagne,
    campagneEnCours,
    campagnes,
    cooperatives: cooperatives.map(({ id, nom }) => ({ id, nom })),
    zones: zonesCampagne.map(({ zone, mensuel: m }) => ({
      id: zone.id,
      nom: zone.nom,
      producteurs: Math.round(zone.producteurs * part),
      fleurs: total(m),
      partTotal: Math.round((total(m) / totalRegion) * 100),
      profil: zone.profil,
      mensuel: m,
      historique: precedentes.map((ancienne) => ({
        campagne: ancienne,
        mensuel: mensuel(zone.fleursParMois, ancienne),
      })),
    })),
  };
}
