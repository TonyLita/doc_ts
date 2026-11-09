import { HttpRequest } from '@angular/common/http';
import { CompteGereMock, ProfilMock, trouverCompte } from './comptes-mock';

// Le jeton de test porte l'identifiant du compte (voir connexion-mock.interceptor.ts) : le « serveur » de test en
// déduit le profil de l'appelant. Un vrai serveur lit le profil dans son propre jeton.
export function compteDeRequete(requete: HttpRequest<unknown>): CompteGereMock | undefined {
  const identifiant = /^Bearer mock-(.+)-\d+$/.exec(requete.headers.get('Authorization') ?? '')?.[1];
  const compte = trouverCompte(identifiant);
  return compte?.actif ? compte : undefined; // un compte désactivé n'a plus aucun droit
}

export function profilDeRequete(requete: HttpRequest<unknown>): ProfilMock | undefined {
  return compteDeRequete(requete)?.profil;
}
