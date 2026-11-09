import { Cooperative, FiltresCampagneCooperative } from '../../../shared/models/cooperative';
import { StatutValidation } from '../../../shared/models/statut-validation';
import { Zone } from '../../../shared/models/zone';

// Contrat d'API SUPPOSÉ en l'absence de backend (CDC §8.6) : à ajuster dès réception de la documentation.
// GET <urlApi>/echantillonnage?campagne=&cooperative=&zone=&statut=&recherche=&page=&taille=  →  Echantillonnage
// Les taux et les effectifs sont calculés par le serveur ; la plateforme reflète la liste des producteurs retenus
// sans la calculer (la méthode de sélection relève de l'équipe agronomique, CDC §14).
export interface FiltresEchantillonnage extends FiltresCampagneCooperative {
  readonly zone?: string;
  readonly statut?: StatutValidation;
  readonly recherche?: string;
  readonly page: number; // à partir de 1
  readonly taille: number;
}

export interface Couverture {
  readonly echantillon: number; // producteurs suivis
  readonly population: number; // producteurs ciblés
  readonly taux: number; // en %
}

export interface CouvertureCooperative extends Couverture {
  readonly id: string;
  readonly nom: string;
}

export interface ProducteurEchantillonne {
  readonly id: string;
  readonly nom: string;
  readonly village: string;
  readonly commune: string;
  readonly cooperative: string;
  readonly zone: string;
  readonly leadFarmers: readonly string[]; // un ou plusieurs référents (CDC §8.6, règle 3)
  readonly statutValidation: StatutValidation;
}

export interface Echantillonnage {
  readonly campagne: string;
  readonly campagneEnCours: string;
  readonly campagnes: readonly string[];
  readonly cooperatives: readonly Cooperative[];
  readonly zones: readonly Zone[];
  readonly couverture: Couverture; // selon les filtres campagne et coopérative
  readonly parCooperative: readonly CouvertureCooperative[];
  readonly producteurs: {
    readonly total: number; // nombre de producteurs correspondant aux filtres, toutes pages confondues
    readonly lignes: readonly ProducteurEchantillonne[]; // la page demandée
  };
}
