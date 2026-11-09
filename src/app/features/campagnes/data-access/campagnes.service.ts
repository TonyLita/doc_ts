import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Campagnes, DonneesCampagne } from './campagnes.modeles';

export const urlCampagnes = `${environment.urlApi}/campagnes`;

@Injectable({ providedIn: 'root' })
export class CampagnesService {
  private readonly clientHttp = inject(HttpClient);

  // Seule couche qui parle au serveur pour ce module (manuel 4.3).
  recuperer(): Observable<Campagnes> {
    return this.clientHttp.get<Campagnes>(urlCampagnes);
  }

  modifier(donnees: DonneesCampagne): Observable<void> {
    return this.clientHttp.put<void>(`${urlCampagnes}/${encodeURIComponent(donnees.id)}`, donnees);
  }

  cloturer(id: string): Observable<void> {
    return this.clientHttp.post<void>(`${urlCampagnes}/${encodeURIComponent(id)}/cloture`, null);
  }

  activer(id: string): Observable<void> {
    return this.clientHttp.post<void>(`${urlCampagnes}/${encodeURIComponent(id)}/activation`, null);
  }
}
