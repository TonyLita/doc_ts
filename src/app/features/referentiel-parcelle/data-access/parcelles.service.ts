import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { parametresFiltres } from '../../../shared/utils/parametres-filtres';
import { DonneesParcelle, FiltresParcelles, Parcelles } from './parcelles.modeles';

export const urlParcelles = `${environment.urlApi}/referentiels/parcelles`;

@Injectable({ providedIn: 'root' })
export class ParcellesService {
  private readonly clientHttp = inject(HttpClient);

  // Seule couche qui parle au serveur pour ce module (manuel 4.3). Un filtre absent n'est pas envoyé. Aucune méthode de
  // suppression : une parcelle s'archive (CDC §8.5).
  lister(filtres: FiltresParcelles): Observable<Parcelles> {
    const params = parametresFiltres(
      { cooperative: filtres.cooperative },
      {
        zone: filtres.zone,
        statut: filtres.statut,
        recherche: filtres.recherche,
        page: filtres.page,
        taille: filtres.taille,
        langue: filtres.langue,
      },
    );
    return this.clientHttp.get<Parcelles>(urlParcelles, { params });
  }

  creer(donnees: DonneesParcelle): Observable<void> {
    return this.clientHttp.post<void>(urlParcelles, donnees);
  }

  modifier(id: string, donnees: DonneesParcelle): Observable<void> {
    return this.clientHttp.put<void>(this.urlParcelle(id), donnees);
  }

  // Archive la parcelle, ou la restaure : elle est de nouveau proposée à la saisie.
  archiver(id: string, archivee: boolean): Observable<void> {
    return this.clientHttp.put<void>(`${this.urlParcelle(id)}/archivage`, { archivee });
  }

  private urlParcelle(id: string): string {
    return `${urlParcelles}/${encodeURIComponent(id)}`;
  }
}
