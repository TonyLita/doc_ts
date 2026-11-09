import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { FichierExporte } from '../../../shared/models/fichier-exporte';
import { chargerAvecCache, oublierCache } from '../../../shared/utils/charger-avec-cache';
import { LangueDocument } from '../../../shared/utils/langue-document';
import { recupererFichier } from '../../../shared/utils/recuperer-fichier';
import {
  ApercuImport,
  ContexteImports,
  PageApercu,
  ResultatImport,
  TypeReferentiel,
} from './imports.modeles';

export const urlImports = `${environment.urlApi}/imports`;

@Injectable({ providedIn: 'root' })
export class ImportsService {
  private readonly clientHttp = inject(HttpClient);
  private readonly identifiantCourant = inject(AuthService).identifiantCourant;

  // Seule couche qui parle au serveur pour ce module (manuel 4.3). La dernière réponse s'affiche aussitôt quand on revient
  // sur la page (par l'autre onglet Import / Export), puis la réponse fraîche la remplace.
  recuperer(): Observable<ContexteImports> {
    return chargerAvecCache(this.cleCache(), () => this.clientHttp.get<ContexteImports>(urlImports));
  }

  // Envoie le fichier pour analyse : le serveur le lit et renvoie un aperçu, sans rien écrire.
  analyser(type: TypeReferentiel, fichier: File): Observable<ApercuImport> {
    const corps = new FormData();
    corps.append('type', type);
    corps.append('fichier', fichier, fichier.name);
    return this.clientHttp.post<ApercuImport>(urlImports, corps);
  }

  apercu(idImport: string, page: number, taille: number): Observable<PageApercu> {
    const params = new HttpParams().set('page', page).set('taille', taille);
    return this.clientHttp.get<PageApercu>(`${urlImports}/${encodeURIComponent(idImport)}/apercu`, { params });
  }

  // Un import confirmé change le journal : la réponse gardée est périmée, elle ne doit pas réapparaître un instant.
  confirmer(idImport: string): Observable<ResultatImport> {
    return this.clientHttp
      .post<ResultatImport>(`${urlImports}/${encodeURIComponent(idImport)}/confirmation`, null)
      .pipe(tap(() => oublierCache(this.cleCache())));
  }

  annuler(idImport: string): Observable<void> {
    return this.clientHttp.delete<void>(`${urlImports}/${encodeURIComponent(idImport)}`);
  }

  rapportErreurs(idImport: string, langue: LangueDocument): Observable<FichierExporte> {
    return recupererFichier(
      this.clientHttp,
      `${urlImports}/${encodeURIComponent(idImport)}/rapport-erreurs`,
      new HttpParams().set('langue', langue),
    );
  }

  modele(type: TypeReferentiel, langue: LangueDocument): Observable<FichierExporte> {
    return recupererFichier(this.clientHttp, `${urlImports}/modele/${type}`, new HttpParams().set('langue', langue));
  }

  // Les données gardées sont propres à l'utilisateur connecté (son profil décide de ce que le serveur renvoie).
  private cleCache(): string {
    return `imports|${this.identifiantCourant() ?? ''}`;
  }
}
