import { EnvironmentProviders, Provider } from '@angular/core';
import { Translation, TRANSLOCO_LOADER, TranslocoLoader } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import connexionAnglais from '../../../../public/i18n/connexion/en.json';
import connexionFrancais from '../../../../public/i18n/connexion/fr.json';
import connexionMalgache from '../../../../public/i18n/connexion/mg.json';
import anglais from '../../../../public/i18n/en.json';
import francais from '../../../../public/i18n/fr.json';
import layoutAnglais from '../../../../public/i18n/layout/en.json';
import layoutFrancais from '../../../../public/i18n/layout/fr.json';
import layoutMalgache from '../../../../public/i18n/layout/mg.json';
import malgache from '../../../../public/i18n/mg.json';
import tableauDeBordAnglais from '../../../../public/i18n/tableau-de-bord/en.json';
import tableauDeBordFrancais from '../../../../public/i18n/tableau-de-bord/fr.json';
import tableauDeBordMalgache from '../../../../public/i18n/tableau-de-bord/mg.json';
import { fournirI18n } from './fournir-i18n';

// Utilisé par les tests uniquement : sert les vrais fichiers de public/i18n sans passer par HTTP.
const dictionnaires: Record<string, Translation> = {
  fr: francais,
  en: anglais,
  mg: malgache,
  'connexion/fr': connexionFrancais,
  'connexion/en': connexionAnglais,
  'connexion/mg': connexionMalgache,
  'layout/fr': layoutFrancais,
  'layout/en': layoutAnglais,
  'layout/mg': layoutMalgache,
  'tableau-de-bord/fr': tableauDeBordFrancais,
  'tableau-de-bord/en': tableauDeBordAnglais,
  'tableau-de-bord/mg': tableauDeBordMalgache,
};

export class ChargeurDeTests implements TranslocoLoader {
  getTranslation(langue: string): Observable<Translation> {
    return of(dictionnaires[langue] ?? {});
  }
}

// Même configuration que l'application (fournirI18n), avec le chargeur de tests à la place du chargeur HTTP.
export function fournirTraductionsDeTests(): (Provider | EnvironmentProviders)[] {
  return [fournirI18n(), { provide: TRANSLOCO_LOADER, useClass: ChargeurDeTests }];
}
