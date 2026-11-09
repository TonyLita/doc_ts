import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { parametresFiltres } from '../../../shared/utils/parametres-filtres';
import { FiltresSynchronisation, Synchronisation } from './synchronisation.modeles';

export const urlSynchronisation = `${environment.urlApi}/synchronisation`;

@Injectable({ providedIn: 'root' })
export class SynchronisationService {
  private readonly clientHttp = inject(HttpClient);

  // Seule couche qui parle au serveur pour ce module (manuel 4.3). Un filtre absent n'est pas envoyé.
  recuperer(filtres: FiltresSynchronisation): Observable<Synchronisation> {
    const params = parametresFiltres(filtres, { statut: filtres.statut, page: filtres.page, taille: filtres.taille });
    return this.clientHttp.get<Synchronisation>(urlSynchronisation, { params });
  }
}
