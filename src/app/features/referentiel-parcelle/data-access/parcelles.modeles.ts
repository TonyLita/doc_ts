import { Cooperative } from '../../../shared/models/cooperative';
import { ChoixProducteur } from '../../../shared/models/producteur';
import { Zone } from '../../../shared/models/zone';
import { LangueDocument } from '../../../shared/utils/langue-document';

// Contrat d'API SUPPOSÉ en l'absence de backend (CDC §8.5) : à ajuster dès réception de la documentation.
// GET <urlApi>/referentiels/parcelles?recherche=&cooperative=&zone=&statut=&page=&taille=&langue=  →  Parcelles
// POST <urlApi>/referentiels/parcelles                      DonneesParcelle        → crée une parcelle
// PUT  <urlApi>/referentiels/parcelles/<id>                 DonneesParcelle        → la modifie
// PUT  <urlApi>/referentiels/parcelles/<id>/archivage       { archivee: boolean }  → l'archive ou la restaure
// Aucune suppression : une parcelle retirée est archivée, elle n'est plus proposée à la saisie et ses saisies restent
// consultables (règle du mobile). Les parcelles sont des données locales alimentées surtout par l'import en masse (§8.16) ;
// le Super Administrateur seul les crée, les modifie ou les archive (403 sinon).
// Le serveur fait foi : le code de la parcelle lui est attribué et reste stable (saisies, mobile) ; le producteur et la
// coopérative doivent exister, la latitude va de -90 à 90, la longitude de -180 à 180, les pieds sont un entier supérieur
// ou égal à 0 (422) ; une parcelle inconnue répond 404. La zone n'est pas stockée : c'est celle du village du producteur
// (§8.2). La production estimée est calculée par le serveur (indicative, coefficient paramétrable §8.7) : elle ne se saisit pas.
// Minimisation des données (CDC §11) : pour un profil non habilité à voir l'identité (le Visiteur), le serveur réduit le
// nom du producteur à ses initiales et indique `identiteComplete: false`. Les noms de zone sont dans la langue demandée.
export type StatutParcelle = 'active' | 'archivee';

export interface LigneParcelle {
  readonly id: string;
  readonly code: string; // nom de la parcelle : son code, le même dans toutes les vues
  readonly producteurId: string;
  readonly producteur: string; // nom et prénom(s), ou initiales si l'identité est réduite
  readonly cooperativeId: string;
  readonly cooperative: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly pieds: number; // effectif estimé
  readonly productionKg: number; // estimation indicative de production de vanille verte
  readonly zone: string | null; // nom de la zone du village du producteur, null si le village n'en a pas
  readonly vanille: boolean; // la parcelle est cultivée en vanille (indicateur de la carte, §8.9)
  readonly archivee: boolean;
}

export interface SynthesesParcelles {
  readonly parcelles: number;
  readonly enVanille: number;
  readonly productionKg: number;
}

export interface Parcelles {
  readonly peutAdministrer: boolean; // droit du profil du jeton (Super Administrateur seul)
  readonly identiteComplete: boolean; // faux : identité réduite pour ce profil
  readonly cooperatives: readonly Cooperative[]; // choix du filtre et du formulaire (§8.3)
  readonly zones: readonly Zone[]; // choix du filtre (§8.2)
  readonly producteurs: readonly ChoixProducteur[]; // choix du formulaire ; vide si le profil ne peut pas administrer
  readonly synthese: SynthesesParcelles; // calculée sur les parcelles qui correspondent aux filtres, toutes pages confondues
  readonly parcelles: {
    readonly total: number; // parcelles qui correspondent aux filtres
    readonly lignes: readonly LigneParcelle[]; // la page demandée
  };
}

export interface FiltresParcelles {
  readonly recherche?: string; // code de la parcelle ou nom du producteur
  readonly cooperative?: string;
  readonly zone?: string;
  readonly statut?: StatutParcelle; // absent : actives et archivées
  readonly page: number; // à partir de 1
  readonly taille: number;
  readonly langue: LangueDocument;
}

// Ce que le formulaire envoie : le producteur et la coopérative sont désignés par leur identifiant.
export interface DonneesParcelle {
  readonly producteur: string;
  readonly cooperative: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly pieds: number;
  readonly vanille: boolean;
}
