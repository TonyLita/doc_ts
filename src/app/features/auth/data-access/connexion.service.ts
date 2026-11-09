import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { Identifiants, ReponseConnexion } from './connexion.modeles';

// Clé de traduction (portée « connexion ») du message affiché pour un statut d'erreur HTTP.
export function cleMessageErreurConnexion(statut: number): string {
  switch (statut) {
    case 401:
      return 'connexion.erreur_identifiants';
    case 0:
      return 'connexion.erreur_reseau';
    default:
      return 'connexion.erreur_inconnue';
  }
}

export const urlConnexion = `${environment.urlApi}/auth/connexion`;

@Injectable({ providedIn: 'root' })
export class ConnexionService {
  private readonly clientHttp = inject(HttpClient);
  private readonly serviceAuth = inject(AuthService);

  // En cas de succès, le jeton est gardé en mémoire par AuthService (manuel 7.1), avec l'utilisateur connecté.
  seConnecter(identifiants: Identifiants): Observable<ReponseConnexion> {
    return this.clientHttp.post<ReponseConnexion>(urlConnexion, identifiants).pipe(
      tap((reponse) => {
        this.serviceAuth.setToken(reponse.jeton);
        this.serviceAuth.setIdentifiantCourant(identifiants.identifiant);
        this.serviceAuth.setProfilCourant(reponse.profil ?? null);
      }),
    );
  }
}
