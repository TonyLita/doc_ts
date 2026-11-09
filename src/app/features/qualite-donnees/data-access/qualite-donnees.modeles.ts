import { Cooperative, FiltresCampagneCooperative } from '../../../shared/models/cooperative';
import { StatutMois } from '../../../shared/models/statut-donnees';
import { Zone } from '../../../shared/models/zone';

// Contrat d'API SUPPOSÉ en l'absence de backend (CDC §8.11) : à ajuster dès réception de la documentation.
// GET <urlApi>/qualite-donnees?campagne=&cooperative=&zone=&page=&taille=  →  QualiteDonnees
// Le score, la complétude, le taux de validation, les statuts de mois et la détection des anomalies sont calculés
// par le serveur (pondérations et seuils à valider avec MCIngredients) ; la plateforme les affiche sans les calculer.
// Consultation seule : la validation humaine des saisies se fait sur le mobile.
export type TypeAnomalie = 'valeur-aberrante' | 'doublon' | 'champ-manquant';

export interface FiltresQualiteDonnees extends FiltresCampagneCooperative {
  readonly zone?: string;
  readonly page: number; // à partir de 1
  readonly taille: number;
}

export interface Anomalie {
  readonly id: string;
  readonly type: TypeAnomalie;
  readonly producteur: string;
  readonly cooperative: string;
  readonly zone: string;
  readonly mois: number; // 1 à 12
}

export interface CompteurAnomalie {
  readonly type: TypeAnomalie;
  readonly nombre: number;
}

export interface QualiteDonnees {
  readonly campagne: string;
  readonly campagneEnCours: string;
  readonly campagnes: readonly string[];
  readonly cooperatives: readonly Cooperative[];
  readonly zones: readonly Zone[];
  readonly scoreQualite: number; // en %, synthèse de la complétude et du taux de validation
  readonly completudeMensuelle: number; // en %
  readonly tauxValidation: number; // en %
  readonly saisiesValidees: number; // observations validées, prises en compte dans les indicateurs officiels
  readonly saisiesEnAttente: number; // observations importées du terrain, statut « à valider »
  readonly statutsMois: readonly StatutMois[];
  readonly anomalies: {
    readonly compteurs: readonly CompteurAnomalie[]; // un par type, toutes pages confondues
    readonly total: number; // nombre d'anomalies correspondant aux filtres, toutes pages confondues
    readonly lignes: readonly Anomalie[]; // la page demandée
  };
}
