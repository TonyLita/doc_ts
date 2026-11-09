import { LangueDocument } from '../shared/utils/langue-document';

// DONNÉES DE TEST : comptes fictifs, un par profil du CDC (§6 et §8.1).
// Dossier temporaire, à supprimer dès que le vrai backend est disponible. Ne jamais livrer en production :
// ces mots de passe sont lisibles par n'importe qui dans le bundle (manuel 7.3).
export type ProfilMock = 'super-administrateur' | 'utilisateur' | 'visiteur';

export interface CompteMock {
  readonly identifiant: string;
  readonly motDePasse: string;
  readonly profil: ProfilMock;
}

export const comptesMock: readonly CompteMock[] = [
  { identifiant: 'admin', motDePasse: 'admin123', profil: 'super-administrateur' },
  { identifiant: 'agronome', motDePasse: 'agro123', profil: 'utilisateur' },
  { identifiant: 'partenaire', motDePasse: 'visiteur123', profil: 'visiteur' },
];

// Magasin en mémoire des comptes, alimenté par la page d'administration (CDC §8.1, §8.17) : un compte créé peut se
// connecter, un compte désactivé est refusé, un rôle changé s'applique à la connexion suivante.
// `comptesMock` reste la liste de départ ; deux comptes fictifs s'y ajoutent pour montrer la gestion.
export interface CompteGereMock extends CompteMock {
  readonly langue: LangueDocument;
  readonly actif: boolean;
}

let comptes: readonly CompteGereMock[] = [
  ...comptesMock.map((compte) => ({ ...compte, langue: 'fr' as const, actif: true })),
  { identifiant: 'csr.sava', motDePasse: 'csr12345', profil: 'utilisateur', langue: 'fr', actif: true },
  { identifiant: 'ancien.agent', motDePasse: 'ancien123', profil: 'utilisateur', langue: 'en', actif: false },
];

export const listerComptes = (): readonly CompteGereMock[] => comptes;

export const trouverCompte = (identifiant: string | undefined): CompteGereMock | undefined =>
  comptes.find((compte) => compte.identifiant === identifiant);

export function creerCompte(compte: CompteGereMock): void {
  comptes = [...comptes, compte];
}

export function modifierCompte(identifiant: string, modification: Partial<Pick<CompteGereMock, 'profil' | 'actif'>>): void {
  comptes = comptes.map((compte) => (compte.identifiant === identifiant ? { ...compte, ...modification } : compte));
}
