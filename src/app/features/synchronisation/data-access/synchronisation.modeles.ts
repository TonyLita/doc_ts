import { Cooperative, FiltresCampagneCooperative } from '../../../shared/models/cooperative';

// Contrat d'API SUPPOSÉ en l'absence de backend (CDC §8.15) : à ajuster dès réception de la documentation.
// GET <urlApi>/synchronisation?campagne=&cooperative=&statut=&page=&taille=  →  Synchronisation
// La synchronisation mobile → cloud est automatique : la plateforme web n'en déclenche aucune (le CDC rejette les
// mécanismes manuels de la maquette) et se contente d'en consulter le journal, à des fins d'audit et de suivi.
// Le serveur calcule le résumé (sur la campagne et la coopérative, sans le filtre de statut) et pagine le journal.
// La règle de résolution des conflits entre deux saisies d'une même fiche reste à définir avec MCIngredients.
export type StatutSynchronisation = 'succes' | 'partiel' | 'erreur';

export type TypeOrigine = 'lead-farmer' | 'technicien';

export interface FiltresSynchronisation extends FiltresCampagneCooperative {
  readonly statut?: StatutSynchronisation;
  readonly page: number; // à partir de 1
  readonly taille: number;
}

export interface EntreeJournal {
  readonly id: string;
  readonly horodatage: string; // date ISO de réception des données
  readonly origine: string; // Lead Farmer ou technicien à l'origine des données transmises
  readonly typeOrigine: TypeOrigine;
  readonly cooperative: string;
  readonly enregistrements: number; // nombre de fiches transmises lors de l'échange
  readonly statut: StatutSynchronisation;
}

export interface ResumeSynchronisation {
  readonly derniere: string | null; // date ISO de la dernière synchronisation, absente s'il n'y en a aucune
  readonly total: number; // nombre d'échanges
  readonly enregistrements: number; // fiches reçues au total
  readonly partielles: number;
  readonly enErreur: number;
}

export interface Synchronisation {
  readonly campagne: string;
  readonly campagneEnCours: string;
  readonly campagnes: readonly string[];
  readonly cooperatives: readonly Cooperative[];
  readonly resume: ResumeSynchronisation;
  readonly journal: {
    readonly total: number; // nombre d'entrées correspondant aux filtres, toutes pages confondues
    readonly lignes: readonly EntreeJournal[]; // la page demandée, la plus récente d'abord
  };
}
