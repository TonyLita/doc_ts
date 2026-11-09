import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Cooperatives, DonneesCooperative } from './cooperatives.modeles';

export const urlCooperatives = `${environment.urlApi}/referentiels/cooperatives`;

@Injectable({ providedIn: 'root' })
export class CooperativesService {
  private readonly clientHttp = inject(HttpClient);

  // Seule couche qui parle au serveur pour ce module (manuel 4.3).
  recuperer(): Observable<Cooperatives> {
    return this.clientHttp.get<Cooperatives>(urlCooperatives);
  }

  creer(donnees: DonneesCooperative): Observable<void> {
    return this.clientHttp.post<void>(urlCooperatives, donnees);
  }

  modifier(id: string, donnees: DonneesCooperative): Observable<void> {
    return this.clientHttp.put<void>(this.urlCooperative(id), donnees);
  }

  supprimer(id: string): Observable<void> {
    return this.clientHttp.delete<void>(this.urlCooperative(id));
  }

  private urlCooperative(id: string): string {
    return `${urlCooperatives}/${encodeURIComponent(id)}`;
  }
}
