import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { parametresFiltres } from '../../../shared/utils/parametres-filtres';
import { AnalyseZones, FiltresAnalyseZones } from './analyse-zones.modeles';

export const urlAnalyseZones = `${environment.urlApi}/analyse-zones`;

@Injectable({ providedIn: 'root' })
export class AnalyseZonesService {
  private readonly clientHttp = inject(HttpClient);

  // Seule couche qui parle au serveur pour ce module (manuel 4.3).
  recuperer(filtres: FiltresAnalyseZones): Observable<AnalyseZones> {
    return this.clientHttp.get<AnalyseZones>(urlAnalyseZones, { params: parametresFiltres(filtres) });
  }
}
