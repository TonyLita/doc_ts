import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { parametresFiltres } from '../../../shared/utils/parametres-filtres';
import { FiltresTableauDeBord, TableauDeBord } from './tableau-de-bord.modeles';

export const urlTableauDeBord = `${environment.urlApi}/tableau-de-bord`;

@Injectable({ providedIn: 'root' })
export class TableauDeBordService {
  private readonly clientHttp = inject(HttpClient);

  // Seule couche qui parle au serveur pour ce module (manuel 4.3).
  recuperer(filtres: FiltresTableauDeBord): Observable<TableauDeBord> {
    return this.clientHttp.get<TableauDeBord>(urlTableauDeBord, { params: parametresFiltres(filtres) });
  }
}
