import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Cartographie } from './cartographie.modeles';

export const urlCartographie = `${environment.urlApi}/cartographie`;

@Injectable({ providedIn: 'root' })
export class CartographieService {
  private readonly clientHttp = inject(HttpClient);

  // Seule couche qui parle au serveur pour ce module (manuel 4.3).
  recuperer(): Observable<Cartographie> {
    return this.clientHttp.get<Cartographie>(urlCartographie);
  }
}
