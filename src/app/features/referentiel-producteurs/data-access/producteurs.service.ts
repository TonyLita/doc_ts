import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FichierExporte } from '../../../shared/models/fichier-exporte';
import { LangueDocument } from '../../../shared/utils/langue-document';
import { parametresFiltres } from '../../../shared/utils/parametres-filtres';
import { recupererFichier } from '../../../shared/utils/recuperer-fichier';
import {
  DonneesProgramme,
  FicheProducteur,
  FiltresExportProducteurs,
  FiltresProducteurs,
  FormatExportProducteurs,
  Producteurs,
} from './producteurs.modeles';

export const urlProducteurs = `${environment.urlApi}/referentiels/producteurs`;

@Injectable({ providedIn: 'root' })
export class ProducteursService {
  private readonly clientHttp = inject(HttpClient);

  // Seule couche qui parle au serveur pour ce module (manuel 4.3). Aucune méthode de création ni de suppression :
  // l'identité et la localisation des producteurs viennent de l'API externe, en lecture seule (CDC §8.4).
  lister(filtres: FiltresProducteurs): Observable<Producteurs> {
    const params = parametresFiltres(
      {},
      { recherche: filtres.recherche, zone: filtres.zone, page: filtres.page, taille: filtres.taille, langue: filtres.langue },
    );
    return this.clientHttp.get<Producteurs>(urlProducteurs, { params });
  }

  // Fichier de la liste affichée (périmètre de la recherche et de la zone), produit par le serveur.
  exporter(format: FormatExportProducteurs, filtres: FiltresExportProducteurs): Observable<FichierExporte> {
    const params = parametresFiltres({}, { format, recherche: filtres.recherche, zone: filtres.zone, langue: filtres.langue });
    return recupererFichier(this.clientHttp, `${urlProducteurs}/export`, params);
  }

  fiche(id: string, langue: LangueDocument): Observable<FicheProducteur> {
    return this.clientHttp.get<FicheProducteur>(this.urlProducteur(id), { params: { langue } });
  }

  // Écriture de la couche complémentaire du programme, réservée au Super Administrateur.
  enregistrerProgramme(id: string, donnees: DonneesProgramme): Observable<void> {
    return this.clientHttp.put<void>(`${this.urlProducteur(id)}/programme`, donnees);
  }

  private urlProducteur(id: string): string {
    return `${urlProducteurs}/${encodeURIComponent(id)}`;
  }
}
