import { Profil } from '../../../core/auth/profil';
import { LangueDocument } from '../../../shared/utils/langue-document';

// Contrat d'API SUPPOSÉ en l'absence de backend (CDC §8.17, §8.1) : à ajuster dès réception de la documentation.
// GET  <urlApi>/administration                                      →  Administration
// POST <urlApi>/administration/utilisateurs                         NouvelUtilisateur  → crée un compte
// PUT  <urlApi>/administration/utilisateurs/<identifiant>           { profil }  → change le rôle
// POST <urlApi>/administration/utilisateurs/<identifiant>/desactivation   → désactive le compte
// POST <urlApi>/administration/utilisateurs/<identifiant>/reactivation    → le réactive
// Le serveur fait foi : seul le Super Administrateur gère les comptes (403 sinon, et la liste des comptes n'est alors
// pas envoyée), l'identifiant est unique (409), le dernier Super Administrateur ne peut être ni désactivé ni rétrogradé
// (409), les champs sont revalidés (422). Il hache le mot de passe (jamais renvoyé), révoque les sessions d'un compte
// désactivé et journalise chaque action sensible (CDC §11).
export type DroitPlateforme =
  | 'consultation'
  | 'rapports'
  | 'exports'
  | 'campagnes'
  | 'imports'
  | 'referentiels'
  | 'utilisateurs'
  | 'producteurs';

export interface Utilisateur {
  readonly identifiant: string;
  readonly profil: Profil;
  readonly langue: LangueDocument; // langue préférée : français ou anglais
  readonly actif: boolean; // Actif / désactivé
}

export interface Permission {
  readonly droit: DroitPlateforme;
  readonly profils: readonly Profil[]; // profils qui possèdent ce droit
}

export interface NouvelUtilisateur {
  readonly identifiant: string;
  readonly motDePasse: string; // mot de passe initial, envoyé une fois au serveur qui le hache
  readonly profil: Profil;
  readonly langue: LangueDocument;
}

export interface Administration {
  readonly peutGererUtilisateurs: boolean; // droit du profil du jeton (Super Administrateur seul)
  readonly utilisateurs: readonly Utilisateur[]; // vide si le profil n'a pas ce droit
  readonly permissions: readonly Permission[]; // tableau récapitulatif, consultable par tous les profils
  readonly campagneActive: string | null; // même donnée que le module Campagnes
}
