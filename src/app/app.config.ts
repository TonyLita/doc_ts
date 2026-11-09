import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { errorInterceptor } from './core/api/error.interceptor';
import { authInterceptor } from './core/auth/auth.interceptor';
import { fournirI18n } from './core/i18n/fournir-i18n';
import { fournirIntercepteursMock } from './donnee_Mock/fournir-intercepteurs-mock';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // Le mock (dossier donnee_Mock, temporaire) vient en dernier : il joue le serveur derrière les autres. Les requêtes
    // passent par fetch, ce qui permet d'annuler un appel long (ex. l'IA locale) quand on quitte la page.
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor, ...fournirIntercepteursMock()]),
    ),
    fournirI18n(),
  ],
};
