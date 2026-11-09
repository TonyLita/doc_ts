export interface FloraisonZoneTerrain {
  readonly zone: string; // nom de la zone agro-écologique,
  readonly fleursParMois: Readonly<Record<string, number>>; // clé : mois court (août à février)
  readonly producteursSuivis: number;
}

export interface FloraisonTerrain {
  readonly campagne: string;
  readonly dateRemontee: string; // jour calendaire ISO
  readonly zones: readonly FloraisonZoneTerrain[];
  readonly observations: readonly string[]; // remarques des agents de terrain, en français
}

export interface RucheTerrain {
  readonly identifiant: string;
  readonly village: string;
  readonly zone: string;
  readonly colonies: number;
  readonly miellKg: number;
  readonly derniereVisite: string; // jour calendaire ISO
  readonly etat: 'bonne' | 'faible' | 'a-surveiller';
}

export interface ActiviteApiculture {
  readonly campagne: string;
  readonly apiculteursSuivis: number;
  readonly ruches: readonly RucheTerrain[];
  readonly totalMiellKg: number;
  readonly remarques: readonly string[];
}

export interface QuotaCooperative {
  readonly cooperative: string;
  readonly commune: string;
  readonly quotaKg: number; // vanille verte attendue sur la campagne
  readonly livreKg: number; // vanille verte remontée à ce jour
  readonly producteursMembres: number;
  readonly quotaAtteintPourcent: number; // calculé sur livreKg / quotaKg, arrondi
}

export interface QuotasCooperatives {
  readonly campagne: string;
  readonly dateRemontee: string;
  readonly cooperatives: readonly QuotaCooperative[];
}

export const floraisonTerrain: FloraisonTerrain = {
  campagne: '2026',
  dateRemontee: '2026-10-28',
  zones: [
    {
      zone: 'Littorale',
      fleursParMois: { août: 2400, sept: 5200, oct: 7600, nov: 4300, déc: 1500, janv: 500, févr: 200 },
      producteursSuivis: 142,
    },
    {
      zone: 'Intermédiaire',
      fleursParMois: { août: 900, sept: 3000, oct: 6200, nov: 8300, déc: 5200, janv: 1900, févr: 500 },
      producteursSuivis: 198,
    },
    {
      zone: 'Haute montagne',
      fleursParMois: { août: 200, sept: 800, oct: 1900, nov: 3600, déc: 4900, janv: 3500, févr: 1100 },
      producteursSuivis: 72,
    },
  ],
  observations: [
    'Pic de floraison sur le littoral en octobre, avec une avance d’environ dix jours sur la campagne précédente.',
    'Intermédiaire : floraison régulière, quelques parcelles à faible densité signalées à Ambodimanga.',
    'Haute montagne : démarrage tardif, pluies fréquentes en septembre ayant retardé la floraison.',
    'Trois producteurs de Sambava à relancer pour la saisie des fleurs de la semaine.',
  ],
};

export const activitesApiculture: ActiviteApiculture = {
  campagne: '2026',
  apiculteursSuivis: 36,
  ruches: [
    { identifiant: 'RUC-SAV-001', village: 'Sambava', zone: 'Littorale', colonies: 8, miellKg: 42, derniereVisite: '2026-10-26', etat: 'bonne' },
    { identifiant: 'RUC-SAV-002', village: 'Sambava', zone: 'Littorale', colonies: 5, miellKg: 18, derniereVisite: '2026-10-26', etat: 'faible' },
    { identifiant: 'RUC-MAH-001', village: 'Mahalevona', zone: 'Intermédiaire', colonies: 10, miellKg: 61, derniereVisite: '2026-10-27', etat: 'bonne' },
    { identifiant: 'RUC-MAH-002', village: 'Mahalevona', zone: 'Intermédiaire', colonies: 6, miellKg: 9, derniereVisite: '2026-10-25', etat: 'a-surveiller' },
    { identifiant: 'RUC-MAH-003', village: 'Mahalevona', zone: 'Haute montagne', colonies: 4, miellKg: 14, derniereVisite: '2026-10-24', etat: 'faible' },
  ],
  totalMiellKg: 144,
  remarques: [
    'Ruche RUC-MAH-002 : présence de fourmis signalée, traitement prévu à la prochaine visite.',
    'Miel de vanille-fleur : récolte en hausse à Mahalevona grâce à la floraison précoce du littoral voisin.',
    'Formation sur la division des colonies demandée par deux apiculteurs de Sambava.',
  ],
};

export const quotasCooperatives: QuotasCooperatives = {
  campagne: '2026',
  dateRemontee: '2026-10-28',
  cooperatives: [
    {
      cooperative: 'OP Sambava',
      commune: 'Sambava',
      quotaKg: 9500,
      livreKg: 4120,
      producteursMembres: 118,
      quotaAtteintPourcent: 43,
    },
    {
      cooperative: 'OP Mahalevona',
      commune: 'Mahalevona',
      quotaKg: 6200,
      livreKg: 3050,
      producteursMembres: 84,
      quotaAtteintPourcent: 49,
    },
  ],
};
