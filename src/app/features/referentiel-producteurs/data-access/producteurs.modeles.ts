import { Cooperative } from '../../../shared/models/cooperative';
import { StatutValidation } from '../../../shared/models/statut-validation';
import { Zone } from '../../../shared/models/zone';
import { LangueDocument } from '../../../shared/utils/langue-document';

// Contrat d'API SUPPOSÉ en l'absence de backend (CDC §8.4) : à ajuster dès réception de la documentation.
// GET <urlApi>/referentiels/producteurs?recherche=&zone=&page=&taille=&langue=  →  Producteurs
// GET <urlApi>/referentiels/producteurs/export?format=&recherche=&zone=&langue=  →  fichier de la liste (xlsx ou pdf)
// GET <urlApi>/referentiels/producteurs/<id>?langue=              →  FicheProducteur
// PUT <urlApi>/referentiels/producteurs/<id>/programme   DonneesProgramme  →  change les données du programme
// La saisie des données de floraison a son propre contrat : voir floraison.modeles.ts.
// Aucune création ni suppression de producteur : identité et localisation viennent de l'API externe (relayée par la
// plateforme, lecture seule) ; un producteur apparaît parce que l'API le fournit.
// Le serveur fait foi : seul le Super Administrateur modifie les données du programme et saisit la floraison (403
// sinon), il vérifie que le producteur et la coopérative existent (404) et revalide le corps (422). Les noms de zone
// sont fournis dans la langue demandée ; la zone d'un producteur est celle de son village (§8.2), elle ne s'écrit pas ici.
// Minimisation des données (CDC §11) : pour un profil non habilité à voir l'identité (le Visiteur), le serveur réduit
// le nom et le prénom à leurs initiales, n'envoie pas le genre, et indique `identiteComplete: false`. La plateforme
// affiche ce qu'elle reçoit et ne reconstitue rien.
// Export de la liste affichée (recherche et zone comprises) : un fichier Excel ou un PDF, produit par le serveur, qui
// réduit l'identité comme pour la liste (CDC §11). Réservé aux profils qui exportent (Super Administrateur, Utilisateur).
export type FormatExportProducteurs = 'xlsx' | 'pdf';
export type StatutEchantillonnage = 'suivi-actif' | 'recense';
export type Genre = 'homme' | 'femme';
export type QuantiteFloraison = 'faible' | 'normal' | 'beaucoup';
export type PeriodeFloraison = 'precoce' | 'normal' | 'retard';
export type CalibrageFleurs = 'court' | 'normal' | 'long';

export interface LigneProducteur {
  readonly id: string; // identifiant stable du producteur
  readonly nom: string; // nom et prénom(s), ou initiales si l'identité est réduite
  readonly village: string; // village / fokontany
  readonly zone: string | null; // identifiant de la zone du village (hérité, §8.2), null s'il n'en a pas
  readonly pieds: number | null; // null tant que la couche du programme n'est pas saisie (« à compléter »)
  readonly ageMoyen: number | null; // en années, idem
  readonly fleursParMois: readonly number[]; // fleurs saisies chaque mois de la campagne, même ordre que Producteurs.mois
  readonly fleurs: number; // total des fleurs pollinisées saisies, 0 si aucune saisie
  readonly derniereSaisie: string | null; // jour calendaire ISO de la dernière saisie, null si aucune
}

export interface Producteurs {
  readonly peutSaisir: boolean; // droit du profil du jeton (Super Administrateur seul)
  readonly identiteComplete: boolean; // faux : identité réduite pour ce profil
  readonly peutExporter: boolean; // droit du profil du jeton (Super Administrateur et Utilisateur)
  readonly zones: readonly Zone[]; // filtre et couleur d'une zone (son rang dans cette liste), noms dans la langue demandée
  readonly mois: readonly number[]; // mois de la campagne (1 à 12) : une colonne chacun, dans l'ordre d'affichage
  readonly producteurs: {
    readonly total: number; // producteurs qui correspondent à la recherche
    readonly lignes: readonly LigneProducteur[]; // la page demandée
  };
}

export interface FiltresProducteurs {
  readonly recherche?: string; // nom et prénom(s) du producteur
  readonly zone?: string; // identifiant d'une zone ; absent : toutes
  readonly page: number; // à partir de 1
  readonly taille: number;
  readonly langue: LangueDocument; // celle des noms de zone
}

// Ce que l'export reprend de la liste : le périmètre, sans la pagination.
export type FiltresExportProducteurs = Pick<FiltresProducteurs, 'recherche' | 'zone' | 'langue'>;

export interface IdentiteProducteur {
  readonly code: string;
  readonly nom: string;
  readonly prenom: string;
  readonly genre: Genre | null; // null : non communiqué à ce profil
  readonly village: string;
  readonly commune: string;
}

// Couche complémentaire gérée localement, rattachée au producteur identifié via l'API. Toutes les valeurs sont
// absentes (null) tant que la couche n'a pas été saisie : le producteur est alors « à compléter ».
export interface ProgrammeProducteur {
  readonly cooperative: string | null; // identifiant de la coopérative
  readonly zone: string | null; // nom de la zone, hérité du village (lecture seule)
  readonly pieds: number | null;
  readonly ageMoyen: number | null; // en années
  readonly statut: StatutEchantillonnage | null;
}

export interface DonneesProgramme {
  readonly cooperative: string;
  readonly pieds: number;
  readonly ageMoyen: number;
  readonly statut: StatutEchantillonnage;
}

export interface ParcelleProducteur {
  readonly id: string;
  readonly libelle: string; // nom de la parcelle : son code
  readonly zone: string | null; // identifiant de la zone de son village, null si le village n'a pas de zone
  readonly fleurs: number; // fleurs pollinisées saisies pour cette parcelle, 0 si aucune saisie
  readonly derniereSaisie: string | null; // jour calendaire ISO, null si aucune saisie
}

// Observation de floraison de la fiche (CDC §8.10) : les valeurs sont des codes techniques stables, le web traduit.
export interface ObservationProducteur {
  readonly id: string;
  readonly campagne: string;
  readonly date: string; // jour calendaire ISO
  readonly quantite: QuantiteFloraison;
  readonly periode: PeriodeFloraison;
  readonly calibrage: CalibrageFleurs | null;
  readonly statutValidation: StatutValidation;
}

export interface FicheProducteur {
  readonly id: string;
  readonly peutParametrer: boolean; // droit du profil du jeton (Super Administrateur seul)
  readonly peutSaisir: boolean; // idem : saisie des données de floraison
  readonly identiteComplete: boolean;
  readonly identite: IdentiteProducteur;
  readonly programme: ProgrammeProducteur;
  readonly cooperatives: readonly Cooperative[]; // choix de la liste des coopératives (§8.3)
  readonly zones: readonly Zone[]; // dans l'ordre du serveur : le rang d'une zone donne sa couleur
  readonly parcelles: readonly ParcelleProducteur[]; // une ou plusieurs (§8.5)
  readonly observations: readonly ObservationProducteur[]; // historique consolidé, du plus récent au plus ancien
}
