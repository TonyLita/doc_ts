import { HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Administration,
  NouvelUtilisateur,
  Permission,
  Utilisateur,
} from '../features/administration/data-access/administration.modeles';
import { urlAdministration } from '../features/administration/data-access/administration.service';
import { Profil } from '../core/auth/profil';
import { languesDocument } from '../shared/utils/langue-document';
import { campagneActive } from './campagnes-mock';
import { creerCompte, listerComptes, modifierCompte, trouverCompte } from './comptes-mock';
import { compteDeRequete } from './profil-mock';
import { refusMock, reponseMock } from './reponses-mock';

// DONNÉES DE TEST de l'administration (CDC §8.17, §8.1). Même statut temporaire que comptes-mock.ts.
// Les comptes vivent dans le magasin de comptes-mock.ts, partagé avec la connexion de test : un compte créé se
// connecte, un compte désactivé est refusé, un rôle changé s'applique à la connexion suivante.
const delaiMs = 500;
const longueurMinMotDePasse = 8;
const profilsValides: readonly Profil[] = ['super-administrateur', 'utilisateur', 'visiteur'];

// Tableau récapitulatif des droits par profil, d'après le CDC §6 et les règles des modules.
const permissions: readonly Permission[] = [
  { droit: 'consultation', profils: ['super-administrateur', 'utilisateur', 'visiteur'] },
  { droit: 'rapports', profils: ['super-administrateur', 'utilisateur'] },
  { droit: 'exports', profils: ['super-administrateur', 'utilisateur'] },
  { droit: 'campagnes', profils: ['super-administrateur'] },
  { droit: 'imports', profils: ['super-administrateur'] },
  { droit: 'referentiels', profils: ['super-administrateur'] },
  { droit: 'utilisateurs', profils: ['super-administrateur'] },
  { droit: 'producteurs', profils: ['super-administrateur'] },
];

const refus = (status: number) => refusMock(status, urlAdministration, delaiMs);

// Le mot de passe ne sort jamais du « serveur ».
const sansMotDePasse = (): Utilisateur[] =>
  listerComptes().map(({ identifiant, profil, langue, actif }) => ({ identifiant, profil, langue, actif }));

// Le dernier Super Administrateur actif ne peut être ni désactivé ni rétrogradé : la plateforme resterait sans administrateur.
function estDernierSuperAdministrateur(identifiant: string): boolean {
  const actifs = listerComptes().filter((compte) => compte.actif && compte.profil === 'super-administrateur');
  return actifs.length === 1 && actifs[0].identifiant === identifiant;
}

function creer(corps: NouvelUtilisateur): Observable<HttpEvent<unknown>> {
  const identifiant = corps.identifiant?.trim();
  if (
    !identifiant ||
    (corps.motDePasse?.length ?? 0) < longueurMinMotDePasse ||
    !profilsValides.includes(corps.profil) ||
    !languesDocument.includes(corps.langue)
  ) {
    return refus(422);
  }
  if (trouverCompte(identifiant)) {
    return refus(409);
  }
  creerCompte({ identifiant, motDePasse: corps.motDePasse, profil: corps.profil, langue: corps.langue, actif: true });
  return reponseMock(null, delaiMs);
}

// Joue le rôle du serveur pour /administration. Les comptes ne se gèrent qu'en Super Administrateur : 403 sinon.
export const administrationMockInterceptor: HttpInterceptorFn = (requete, suivant) => {
  if (!requete.url.startsWith(urlAdministration)) {
    return suivant(requete);
  }
  const compte = compteDeRequete(requete);
  const administrateur = compte?.profil === 'super-administrateur';
  const [, ressource, cible, action] = requete.url.slice(urlAdministration.length).split('/').map(decodeURIComponent);

  if (requete.method === 'GET' && ressource === undefined) {
    const corps: Administration = {
      peutGererUtilisateurs: administrateur,
      utilisateurs: administrateur ? sansMotDePasse() : [],
      permissions,
      campagneActive: campagneActive() ?? null,
    };
    return reponseMock(corps, delaiMs);
  }
  if (ressource !== 'utilisateurs') {
    return suivant(requete);
  }
  if (!administrateur) {
    return refus(403);
  }
  if (requete.method === 'POST' && cible === undefined) {
    return creer(requete.body as NouvelUtilisateur);
  }
  const visee = trouverCompte(cible);
  if (cible && !visee) {
    return refus(404);
  }
  if (cible && visee) {
    // Se désactiver ou se rétrograder soi-même, ou retirer le dernier Super Administrateur : refusé par le serveur.
    const protege = visee.identifiant === compte?.identifiant || estDernierSuperAdministrateur(visee.identifiant);
    if (requete.method === 'PUT') {
      const profil = (requete.body as { profil: Profil }).profil;
      if (!profilsValides.includes(profil)) {
        return refus(422);
      }
      if (protege && profil !== visee.profil) {
        return refus(409);
      }
      modifierCompte(cible, { profil });
      return reponseMock(null, delaiMs);
    }
    if (requete.method === 'POST' && action === 'desactivation') {
      if (protege) {
        return refus(409);
      }
      modifierCompte(cible, { actif: false });
      return reponseMock(null, delaiMs);
    }
    if (requete.method === 'POST' && action === 'reactivation') {
      modifierCompte(cible, { actif: true });
      return reponseMock(null, delaiMs);
    }
  }
  return suivant(requete);
};
