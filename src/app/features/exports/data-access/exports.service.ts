import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { FichierExporte } from '../../../shared/models/fichier-exporte';
import { chargerAvecCache } from '../../../shared/utils/charger-avec-cache';
import { parametresFiltres } from '../../../shared/utils/parametres-filtres';
import { recupererFichier } from '../../../shared/utils/recuperer-fichier';
import {
  ApercusExport,
  ContexteExports,
  FiltresExports,
  FormatTableur,
  GraphiqueExportable,
  ResumeExport,
} from './exports.modeles';

export const urlExports = `${environment.urlApi}/exports`;

@Injectable({ providedIn: 'root' })
export class ExportsService {
  private readonly clientHttp = inject(HttpClient);
  private readonly identifiantCourant = inject(AuthService).identifiantCourant;

  // Seule couche qui parle au serveur pour ce module (manuel 4.3). Un filtre absent n'est pas envoyé. Le contexte et le
  // résumé s'affichent aussitôt avec leur dernière réponse quand on revient sur la page (par l'autre onglet Import / Export),
  // puis la réponse fraîche les remplace.
  recuperer(): Observable<ContexteExports> {
    return chargerAvecCache(this.cleCache('contexte'), () => this.clientHttp.get<ContexteExports>(urlExports));
  }

  producteurs(filtres: FiltresExports, format: FormatTableur): Observable<FichierExporte> {
    return this.fichier(`${urlExports}/producteurs`, filtres, { format });
  }

  rapportPdf(filtres: FiltresExports): Observable<FichierExporte> {
    return this.fichier(`${urlExports}/rapport-pdf`, filtres);
  }

  graphique(graphique: GraphiqueExportable, filtres: FiltresExports): Observable<FichierExporte> {
    return this.fichier(`${urlExports}/graphiques/${graphique}`, filtres);
  }

  resume(filtres: FiltresExports): Observable<ResumeExport> {
    return chargerAvecCache(this.cleCache(`resume|${JSON.stringify(filtres)}`), () =>
      this.clientHttp.get<ResumeExport>(`${urlExports}/resume`, { params: this.parametres(filtres) }),
    );
  }

  // Données des aperçus de graphiques : gardées comme le résumé, pour le même périmètre et la même langue.
  apercus(filtres: FiltresExports): Observable<ApercusExport> {
    return chargerAvecCache(this.cleCache(`apercus|${JSON.stringify(filtres)}`), () =>
      this.clientHttp.get<ApercusExport>(`${urlExports}/apercus`, { params: this.parametres(filtres) }),
    );
  }

  // Les données gardées sont propres à l'utilisateur connecté et, pour le résumé, au périmètre et à la langue demandés.
  private cleCache(partie: string): string {
    return `exports|${this.identifiantCourant() ?? ''}|${partie}`;
  }

  private fichier(
    url: string,
    filtres: FiltresExports,
    autres: Readonly<Record<string, string>> = {},
  ): Observable<FichierExporte> {
    return recupererFichier(this.clientHttp, url, this.parametres(filtres, autres));
  }

  private parametres(filtres: FiltresExports, autres: Readonly<Record<string, string>> = {}) {
    return parametresFiltres(filtres, { zone: filtres.zone, langue: filtres.langue, ...autres });
  }
}
