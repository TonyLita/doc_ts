import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { parametresFiltres } from '../../../shared/utils/parametres-filtres';
import { FiltresQualiteDonnees, QualiteDonnees } from './qualite-donnees.modeles';

export const urlQualiteDonnees = `${environment.urlApi}/qualite-donnees`;

@Injectable({ providedIn: 'root' })
export class QualiteDonneesService {
  private readonly clientHttp = inject(HttpClient);

  // Seule couche qui parle au serveur pour ce module (manuel 4.3). Un filtre absent n'est pas envoyé.
  recuperer(filtres: FiltresQualiteDonnees): Observable<QualiteDonnees> {
    const params = parametresFiltres(filtres, { zone: filtres.zone, page: filtres.page, taille: filtres.taille });
    return this.clientHttp.get<QualiteDonnees>(urlQualiteDonnees, { params });
  }
}
