import { Cooperative, FiltresCampagneCooperative } from '../../../shared/models/cooperative';
import { StatutValidation } from '../../../shared/models/statut-validation';
import { Zone } from '../../../shared/models/zone';

// Contrat d'API SUPPOSÉ en l'absence de backend (CDC §8.10) : à ajuster dès réception de la documentation.
// GET <urlApi>/observations?campagne=&cooperative=&zone=&statut=  →  Observations
// Sans « statut », les observations validées et en attente sont comptées ensemble.
// Les valeurs sont des codes techniques stables, indépendants de la langue : le web traduit les libellés.
// Le seuil de représentativité n'est pas défini par le CDC : le serveur l'applique et renvoie le résultat.
export type Famille = 'quantite' | 'periode' | 'calibrage';

export interface FiltresObservations extends FiltresCampagneCooperative {
  readonly zone?: string;
  readonly statut?: StatutValidation;
}

export interface ValeurObservation {
  readonly valeur: string; // code : faible, normal, beaucoup, precoce, retard, court, long…
  readonly effectif: number;
  readonly pourcentage: number; // calculé par le serveur
}

export interface FamilleObservations {
  readonly famille: Famille;
  readonly total: number; // nombre d'observations de la famille
  readonly representatif: boolean; // assez d'observations pour être statistiquement significatif
  readonly valeurs: readonly ValeurObservation[]; // dans l'ordre logique, même avec un effectif nul
}

export interface Observations {
  readonly campagne: string;
  readonly campagneEnCours: string;
  readonly campagnes: readonly string[];
  readonly cooperatives: readonly Cooperative[];
  readonly zones: readonly Zone[];
  readonly enAttente: number; // observations en attente de validation (selon campagne, coopérative et zone)
  readonly familles: readonly FamilleObservations[];
}
