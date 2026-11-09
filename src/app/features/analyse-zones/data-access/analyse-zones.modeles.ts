import { Cooperative, FiltresCampagneCooperative } from '../../../shared/models/cooperative';

// Contrat d'API SUPPOSÉ en l'absence de backend (CDC §8.8) : à ajuster dès réception de la documentation.
// GET <urlApi>/analyse-zones?campagne=&cooperative=  →  AnalyseZones
// La liste des zones vient du serveur : elle est « à valider » avec MCIngredients (CDC §14), jamais figée ici.
// Le profil de période (précoce, normal, retardé) est calculé par le serveur : le CDC ne chiffre pas de seuil.
export type ProfilPeriode = 'precoce' | 'normal' | 'retarde';

export type FiltresAnalyseZones = FiltresCampagneCooperative;

export interface FleursDuMois {
  readonly mois: number; // 1 à 12
  readonly fleurs: number;
}

export interface CampagnePrecedente {
  readonly campagne: string;
  readonly mensuel: readonly FleursDuMois[];
}

export interface ZoneAnalyse {
  readonly id: string;
  readonly nom: string;
  readonly producteurs: number;
  readonly fleurs: number; // total de la campagne affichée
  readonly partTotal: number; // contribution de la zone au total de la campagne, en %
  readonly profil: ProfilPeriode; // par rapport à la moyenne régionale
  readonly mensuel: readonly FleursDuMois[]; // campagne affichée
  readonly historique: readonly CampagnePrecedente[]; // campagnes précédentes, de la plus ancienne à la plus récente
}

export interface AnalyseZones {
  readonly campagne: string;
  readonly campagneEnCours: string;
  readonly campagnes: readonly string[];
  readonly cooperatives: readonly Cooperative[];
  readonly zones: readonly ZoneAnalyse[];
}
