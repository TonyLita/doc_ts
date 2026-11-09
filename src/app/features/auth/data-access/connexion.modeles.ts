import { Profil } from '../../../core/auth/profil';

// Contrat d'API SUPPOSÉ en l'absence de backend : à ajuster dès réception de la documentation.
// POST <urlApi>/auth/connexion  { identifiant, motDePasse }  →  { jeton, profil }
export interface Identifiants {
  readonly identifiant: string;
  readonly motDePasse: string;
}

export interface ReponseConnexion {
  readonly jeton: string;
  readonly profil?: Profil; // profil du compte : sert à n'afficher que les menus et pages autorisés
}
