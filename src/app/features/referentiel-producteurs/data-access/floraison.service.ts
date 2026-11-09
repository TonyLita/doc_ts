import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ChoixProducteur, FloraisonProducteur, SaisieFloraison } from './floraison.modeles';

export const urlFloraison = `${environment.urlApi}/floraison/producteurs`;

@Injectable({ providedIn: 'root' })
export class FloraisonService {
  private readonly clientHttp = inject(HttpClient);

  // Seule couche qui parle au serveur pour la saisie de floraison (manuel 4.3).
  producteurs(): Observable<readonly ChoixProducteur[]> {
    return this.clientHttp.get<readonly ChoixProducteur[]>(urlFloraison);
  }

  producteur(id: string): Observable<FloraisonProducteur> {
    return this.clientHttp.get<FloraisonProducteur>(this.urlProducteur(id));
  }

  enregistrer(id: string, saisie: SaisieFloraison): Observable<void> {
    return this.clientHttp.post<void>(`${this.urlProducteur(id)}/saisies`, saisie);
  }

  private urlProducteur(id: string): string {
    return `${urlFloraison}/${encodeURIComponent(id)}`;
  }
}
