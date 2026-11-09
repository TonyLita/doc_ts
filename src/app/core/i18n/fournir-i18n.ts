import {
  EnvironmentProviders,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { LangueService } from './langue.service';
import { langueParDefaut, languesDisponibles } from './langues';
import { TranslocoHttpLoader } from './transloco-http.loader';

// Point d'entrée unique du module d'internationalisation : à appeler une seule fois dans app.config.ts.
// Configure Transloco et charge la langue avant le premier affichage (manuel 5.10).
export function fournirI18n(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: [...languesDisponibles],
        defaultLang: langueParDefaut,
        // Une clé absente (ex. traduction malgache incomplète) s'affiche en français.
        fallbackLang: langueParDefaut,
        missingHandler: { useFallbackTranslation: true },
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideAppInitializer(() => inject(LangueService).initialiser()),
  ]);
}
