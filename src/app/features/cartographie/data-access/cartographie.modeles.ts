// Contrat d'API SUPPOSÉ en l'absence de backend (CDC §8.9, §8.5, §8.3) : à ajuster dès réception de la documentation.
// GET <urlApi>/cartographie  →  Cartographie
// Le filtre par coopérative se fait dans le navigateur : environ 2 000 parcelles tiennent en une seule réponse.
import { Cooperative } from '../../../shared/models/cooperative';

export interface CentreCooperative {
  readonly cooperative: string; // id de la coopérative
  readonly latitude: number;
  readonly longitude: number;
}

export interface Parcelle {
  readonly id: string;
  readonly producteur: string;
  readonly cooperative: string; // id de la coopérative
  readonly latitude: number;
  readonly longitude: number;
  readonly pieds: number; // nombre de pieds estimé
  readonly productionKg: number; // production estimée, indicative
  readonly vanille: boolean; // la parcelle est cultivée en vanille
}

export interface Cartographie {
  readonly cooperatives: readonly Cooperative[];
  readonly centres: readonly CentreCooperative[];
  readonly parcelles: readonly Parcelle[];
}
