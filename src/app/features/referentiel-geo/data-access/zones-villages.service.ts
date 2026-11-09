import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { urlVillages } from './referentiel-externe.service';
import { AffectationZone } from './referentiel-geo.modeles';

export const urlZonesVillages = `${urlVillages}/zones`;

@Injectable({ providedIn: 'root' })
export class ZonesVillagesService {
  private readonly clientHttp = inject(HttpClient);

  // Seule écriture du module : le rattachement village → zone, propre au programme. Elle part vers la plateforme,
  // jamais vers l'API externe (manuel §4.6).
  affecter(affectations: readonly AffectationZone[]): Observable<void> {
    return this.clientHttp.put<void>(urlZonesVillages, { affectations });
  }
}
