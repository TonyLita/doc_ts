import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, switchMap, throwError, timer } from 'rxjs';
import { Identifiants, ReponseConnexion } from '../features/auth/data-access/connexion.modeles';
import { urlConnexion } from '../features/auth/data-access/connexion.service';
import { trouverCompte } from './comptes-mock';

// Durée simulée du serveur : permet de voir le bouton désactivé pendant l'envoi.
export const delaiSimuleMs = 400;

// Joue le rôle du serveur pour POST /auth/connexion. Placé en dernier dans la chaîne : l'erreur 401 passe
// donc par errorInterceptor, comme avec un vrai backend. Les autres requêtes continuent vers le réseau.
export const connexionMockInterceptor: HttpInterceptorFn = (requete, suivant) => {
  if (requete.method !== 'POST' || requete.url !== urlConnexion) {
    return suivant(requete);
  }

  const { identifiant, motDePasse } = requete.body as Identifiants;
  // Un compte désactivé est refusé comme un identifiant inconnu : le serveur ne révèle rien de plus.
  const candidat = trouverCompte(identifiant);
  const compte = candidat?.actif && candidat.motDePasse === motDePasse ? candidat : undefined;

  return timer(delaiSimuleMs).pipe(
    switchMap(() =>
      compte
        ? of(
            new HttpResponse<ReponseConnexion>({
              status: 200,
              body: { jeton: `mock-${compte.identifiant}-${Date.now()}`, profil: compte.profil },
            }),
          )
        : throwError(
            () => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', url: requete.url }),
          ),
    ),
  );
};
