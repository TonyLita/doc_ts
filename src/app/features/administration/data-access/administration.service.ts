import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Profil } from '../../../core/auth/profil';
import { Administration, NouvelUtilisateur } from './administration.modeles';

export const urlAdministration = `${environment.urlApi}/administration`;

@Injectable({ providedIn: 'root' })
export class AdministrationService {
  private readonly clientHttp = inject(HttpClient);

  // Seule couche qui parle au serveur pour ce module (manuel 4.3).
  recuperer(): Observable<Administration> {
    return this.clientHttp.get<Administration>(urlAdministration);
  }

  creer(utilisateur: NouvelUtilisateur): Observable<void> {
    return this.clientHttp.post<void>(`${urlAdministration}/utilisateurs`, utilisateur);
  }

  changerRole(identifiant: string, profil: Profil): Observable<void> {
    return this.clientHttp.put<void>(this.urlUtilisateur(identifiant), { profil });
  }

  desactiver(identifiant: string): Observable<void> {
    return this.clientHttp.post<void>(`${this.urlUtilisateur(identifiant)}/desactivation`, null);
  }

  reactiver(identifiant: string): Observable<void> {
    return this.clientHttp.post<void>(`${this.urlUtilisateur(identifiant)}/reactivation`, null);
  }

  private urlUtilisateur(identifiant: string): string {
    return `${urlAdministration}/utilisateurs/${encodeURIComponent(identifiant)}`;
  }
}
