// Complétude des données d'un mois de campagne (CDC §8.7, §8.11).
export type StatutDonnees = 'complet' | 'partiel' | 'en-attente';

export interface StatutMois {
  readonly mois: number; // 1 à 12
  readonly statut: StatutDonnees;
}
