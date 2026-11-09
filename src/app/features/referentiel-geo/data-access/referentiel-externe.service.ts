import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LangueDocument } from '../../../shared/utils/langue-document';
import { parametresFiltres } from '../../../shared/utils/parametres-filtres';
import { ArbreGeographique, FiltresVillages, ReferentielVillages } from './referentiel-geo.modeles';

export const urlVillages = `${environment.urlApi}/referentiels/villages`;
export const urlArbre = `${urlVillages}/arbre`;

@Injectable({ providedIn: 'root' })
export class ReferentielExterneService {
  private readonly clientHttp = inject(HttpClient);

  // Point de contact avec les villages et communes de l'API externe (manuel §4.6) : lecture seule par construction,
  // aucune méthode de création, de modification ni de suppression. Un filtre absent n'est pas envoyé.
  villages(filtres: FiltresVillages): Observable<ReferentielVillages> {
    const params = parametresFiltres(
      {},
      {
        commune: filtres.commune,
        zone: filtres.zone,
        sansZone: filtres.sansZone ? 'true' : undefined,
        recherche: filtres.recherche,
        page: filtres.page,
        taille: filtres.taille,
        langue: filtres.langue,
      },
    );
    return this.clientHttp.get<ReferentielVillages>(urlVillages, { params });
  }

  // La hiérarchie communes › villages › parcelles, pour l'arborescence de la page.
  arbre(langue: LangueDocument): Observable<ArbreGeographique> {
    return this.clientHttp.get<ArbreGeographique>(urlArbre, { params: { langue } });
  }
}
