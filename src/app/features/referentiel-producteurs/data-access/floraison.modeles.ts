// Contrat d'API SUPPOSÉ en l'absence de backend : à ajuster dès réception de la documentation.
// GET  <urlApi>/floraison/producteurs                      →  ChoixProducteur[]   (menu déroulant de la saisie)
// GET  <urlApi>/floraison/producteurs/<id>                 →  FloraisonProducteur (parcelles et historique)
// POST <urlApi>/floraison/producteurs/<id>/saisies  SaisieFloraison  →  enregistre une saisie
// ATTENTION : le CDC réserve la saisie des observations de floraison à l'application mobile (§5, §8.10) ; cette saisie
// web est une extension demandée, à faire valider par MCIngredients (profil autorisé, statut « à valider »).
// Le serveur fait foi : seul le Super Administrateur saisit (403 sinon, et la liste des producteurs n'est alors pas
// envoyée), il vérifie que le producteur existe (404) et revalide le corps (422) : date valide, parcelle du producteur,
// nombre de fleurs pollinisées entier et supérieur à 0.
// Le type vit dans shared/models : la saisie de floraison et le référentiel des parcelles proposent la même liste de choix.
export type { ChoixProducteur } from '../../../shared/models/producteur';

export interface ParcelleSaisie {
  readonly id: string;
  readonly code: string; // nom de la parcelle
}

export interface HistoriqueSaisie {
  readonly id: string;
  readonly date: string; // jour calendaire ISO
  readonly fleurs: number;
}

export interface FloraisonProducteur {
  readonly parcelles: readonly ParcelleSaisie[];
  readonly saisies: readonly HistoriqueSaisie[]; // de la plus récente à la plus ancienne
}

export interface SaisieFloraison {
  readonly date: string; // jour calendaire ISO (aaaa-mm-jj)
  readonly parcelle: string;
  readonly fleurs: number; // nombre de fleurs pollinisées, entier supérieur à 0
}
