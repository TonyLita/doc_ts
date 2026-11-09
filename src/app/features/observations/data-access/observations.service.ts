import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { parametresFiltres } from '../../../shared/utils/parametres-filtres';
import { FiltresObservations, Observations } from './observations.modeles';

export const urlObservations = `${environment.urlApi}/observations`;

@Injectable({ providedIn: 'root' })
export class ObservationsService {
  private readonly clientHttp = inject(HttpClient);

  // Seule couche qui parle au serveur pour ce module (manuel 4.3). Un filtre absent n'est pas envoyé.
  recuperer(filtres: FiltresObservations): Observable<Observations> {
    const params = parametresFiltres(filtres, { zone: filtres.zone, statut: filtres.statut });
    return this.clientHttp.get<Observations>(urlObservations, { params });
  }
}
