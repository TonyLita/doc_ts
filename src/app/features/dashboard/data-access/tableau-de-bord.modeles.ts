// Contrat d'API SUPPOSÉ en l'absence de backend (CDC §8.7) : à ajuster dès réception de la documentation.
// GET <urlApi>/tableau-de-bord?campagne=&cooperative=  →  TableauDeBord
// Sans paramètre « campagne », le serveur renvoie la campagne en cours (CDC §8.12).
import { Cooperative, FiltresCampagneCooperative } from '../../../shared/models/cooperative';
import { StatutMois } from '../../../shared/models/statut-donnees';

export interface FloraisonMensuelle {
  readonly mois: number; // 1 à 12
  readonly fleursParZone: readonly number[]; // même ordre que TableauDeBord.zones
}

export type FiltresTableauDeBord = FiltresCampagneCooperative;

export interface TableauDeBord {
  readonly campagne: string;
  readonly campagneEnCours: string;
  readonly campagnes: readonly string[];
  readonly cooperatives: readonly Cooperative[];
  readonly producteursSuivis: number;
  readonly tauxCouverture: number; // en %
  readonly totalFleurs: number;
  readonly moisPic: number; // 1 à 12
  readonly productionEstimeeKg: number;
  readonly cooperativesActives: number;
  readonly tauxSaisiesValides: number; // en %
  readonly statutsMois: readonly StatutMois[];
  readonly zones: readonly string[];
  readonly floraisonMensuelle: readonly FloraisonMensuelle[];
  readonly derniereSynchronisation: string; // date ISO
}
