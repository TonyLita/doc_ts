// Producteur tel que les formulaires le proposent dans une liste de choix (CDC §8.4). Le nom est celui que le serveur
// accorde au profil : complet, ou réduit à des initiales pour le Visiteur (CDC §11).
export interface ChoixProducteur {
  readonly id: string;
  readonly nom: string; // nom et prénom(s)
  readonly village: string;
}
