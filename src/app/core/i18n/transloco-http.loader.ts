import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

// Charge à la demande le fichier JSON de traductions d'une langue (manuel 5.10).
// Pour une portée, Transloco passe « <portée>/<langue> » : public/i18n/<portée>/<langue>.json.
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly clientHttp = inject(HttpClient);

  getTranslation(langue: string) {
    return this.clientHttp.get<Translation>(`i18n/${langue}.json`);
  }
}
