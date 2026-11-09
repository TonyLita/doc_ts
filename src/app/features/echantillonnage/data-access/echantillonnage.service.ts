import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { parametresFiltres } from '../../../shared/utils/parametres-filtres';
import { Echantillonnage, FiltresEchantillonnage } from './echantillonnage.modeles';

export const urlEchantillonnage = `${environment.urlApi}/echantillonnage`;

@Injectable({ providedIn: 'root' })
export class EchantillonnageService {
  private readonly clientHttp = inject(HttpClient);

  // Seule couche qui parle au serveur pour ce module (manuel 4.3). Un filtre absent n'est pas envoyé.
  recuperer(filtres: FiltresEchantillonnage): Observable<Echantillonnage> {
    const params = parametresFiltres(filtres, {
      zone: filtres.zone,
      statut: filtres.statut,
      recherche: filtres.recherche,
      page: filtres.page,
      taille: filtres.taille,
    });
    return this.clientHttp.get<Echantillonnage>(urlEchantillonnage, { params });
  }
}
