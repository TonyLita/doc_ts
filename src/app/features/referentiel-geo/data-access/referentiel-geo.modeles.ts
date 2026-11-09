import { Zone } from '../../../shared/models/zone';
import { LangueDocument } from '../../../shared/utils/langue-document';

// Contrat d'API SUPPOSÉ en l'absence de backend (CDC §8.2) : à ajuster dès réception de la documentation.
// GET <urlApi>/referentiels/villages?commune=&zone=&sansZone=&recherche=&page=&taille=&langue=  →  ReferentielVillages
// GET <urlApi>/referentiels/villages/arbre?langue=  →  ArbreGeographique (communes › villages › parcelles, lecture seule)
// PUT <urlApi>/referentiels/villages/zones   { affectations: AffectationZone[] }  →  change la zone des villages indiqués
// Communes et villages viennent de l'API externe, relayée par la plateforme cloud (cache à durée de vie limitée,
// manuel §4.6) : la plateforme web ne les crée, ne les modifie ni ne les supprime jamais. Seul le rattachement
// village → zone est propre au programme et s'écrit sur la plateforme, jamais vers l'API externe.
// Le serveur fait foi : seul le Super Administrateur change une zone (403 sinon), il vérifie que les villages et les
// zones existent (404) et revalide le corps (422). Les noms de zone sont fournis dans la langue demandée.
// Les parcelles (§8.5) viennent de la plateforme, jointes au village par le serveur ; la zone d'une parcelle est celle de
// son village. Aucun nom de producteur ni coordonnée dans l'arborescence : seulement des codes de parcelle.
export interface Commune {
  readonly id: string;
  readonly nom: string;
}

export interface Village {
  readonly id: string;
  readonly nom: string; // village ou fokontany
  readonly commune: string; // nom de la commune de rattachement
  readonly zone: string | null; // identifiant de la zone, ou null tant que le village n'est pas rattaché
}

export interface CompteurZone {
  readonly zone: string;
  readonly villages: number;
  readonly parcelles: number; // parcelles des villages de cette zone
}

// Compteurs de l'ensemble du référentiel : ils ignorent les filtres de la page.
export interface CompteursVillages {
  readonly communes: number;
  readonly total: number; // villages et fokontany
  readonly parcelles: number;
  readonly sansZone: number; // villages sans zone
  readonly parcellesSansZone: number; // parcelles de ces villages
  readonly parZone: readonly CompteurZone[];
}

export interface ReferentielVillages {
  readonly peutParametrer: boolean; // droit du profil du jeton (Super Administrateur seul)
  readonly sourceDisponible: boolean; // faux : l'API externe ne répond pas, la plateforme sert son dernier jeu connu
  readonly derniereSynchronisation: string | null; // instant ISO de la dernière mise à jour depuis l'API externe
  readonly zones: readonly Zone[];
  readonly communes: readonly Commune[];
  readonly compteurs: CompteursVillages;
  readonly villages: {
    readonly total: number; // villages qui correspondent aux filtres
    readonly lignes: readonly Village[]; // la page demandée
  };
}

export interface FiltresVillages {
  readonly commune?: string;
  readonly zone?: string;
  readonly sansZone?: boolean; // vrai : seulement les villages non rattachés (le filtre de zone est alors ignoré)
  readonly recherche?: string;
  readonly page: number; // à partir de 1
  readonly taille: number;
  readonly langue: LangueDocument;
}

export interface AffectationZone {
  readonly village: string;
  readonly zone: string | null; // null : retire le rattachement du village
}

export interface ParcelleArbre {
  readonly id: string;
  readonly code: string; // code de la parcelle, jamais le nom de son producteur
}

export interface VillageArbre {
  readonly id: string;
  readonly nom: string;
  readonly zone: string | null; // identifiant de la zone, ou null tant que le village n'est pas rattaché
  readonly parcelles: readonly ParcelleArbre[];
}

export interface CommuneArbre {
  readonly id: string;
  readonly nom: string;
  readonly villages: readonly VillageArbre[];
}

// Hiérarchie complète, en une requête : l'ordre des zones donne leur couleur (même rang = même couleur partout).
export interface ArbreGeographique {
  readonly zones: readonly Zone[];
  readonly communes: readonly CommuneArbre[];
}
