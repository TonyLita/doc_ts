import { Routes } from '@angular/router';
import { profilGuard } from './core/auth/profil.guard';
import { provideTranslocoScope } from '@jsverse/transloco';
import { authGuard } from './core/auth/auth.guard';

// Chaque feature est chargée à la demande via loadComponent / loadChildren (manuel 5.7).
// La page de connexion est servie sur /connexion, URL vers laquelle redirige authGuard (manuel 5.4).
// Les textes d'une page sont chargés avec elle : public/i18n/<portée>/<langue>.json (manuel 5.10).
export const routes: Routes = [
  { path: '', redirectTo: 'connexion', pathMatch: 'full' },
  { path: 'login', redirectTo: 'connexion', pathMatch: 'full' },
  {
    path: 'connexion',
    providers: [provideTranslocoScope('connexion')],
    loadComponent: () =>
      import('./features/auth/feature/login-page/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    // Coquille de toutes les pages protégées (header, sidebar, contenu) : voir core/layout.
    // Une nouvelle page protégée s'ajoute dans children et ne fournit que son contenu.
    path: '',
    canActivate: [authGuard],
    providers: [provideTranslocoScope('layout')],
    loadComponent: () =>
      import('./core/layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'tableau-de-bord',
        // Alias explicite : un nom de portée avec tirets serait transformé par Transloco dans les clés.
        providers: [provideTranslocoScope({ scope: 'tableau-de-bord', alias: 'tableau_de_bord' })],
        loadComponent: () =>
          import('./features/dashboard/feature/tableau-de-bord-page/tableau-de-bord-page.component').then(
            (m) => m.TableauDeBordPageComponent,
          ),
      },
      {
        path: 'qualite-donnees',
        providers: [provideTranslocoScope({ scope: 'qualite-donnees', alias: 'qualite_donnees' })],
        loadComponent: () =>
          import('./features/qualite-donnees/feature/qualite-donnees-page/qualite-donnees-page.component').then(
            (m) => m.QualiteDonneesPageComponent,
          ),
      },
      {
        path: 'campagnes',
        providers: [provideTranslocoScope('campagnes')],
        loadComponent: () =>
          import('./features/campagnes/feature/campagnes-page/campagnes-page.component').then(
            (m) => m.CampagnesPageComponent,
          ),
      },
      {
        path: 'rapports-ia',
        // Alias explicite : un nom de portée avec tirets serait transformé par Transloco dans les clés.
        providers: [provideTranslocoScope({ scope: 'rapports-ia', alias: 'rapports_ia' })],
        loadComponent: () =>
          import('./features/rapports-ia/feature/rapports-ia-page/rapports-ia-page.component').then(
            (m) => m.RapportsIaPageComponent,
          ),
      },
      {
        path: 'exports',
        canActivate: [profilGuard(['super-administrateur', 'utilisateur'])],
        providers: [provideTranslocoScope('exports')],
        loadComponent: () =>
          import('./features/exports/feature/exports-page/exports-page.component').then(
            (m) => m.ExportsPageComponent,
          ),
      },
      {
        path: 'synchronisation',
        providers: [provideTranslocoScope('synchronisation')],
        loadComponent: () =>
          import('./features/synchronisation/feature/synchronisation-page/synchronisation-page.component').then(
            (m) => m.SynchronisationPageComponent,
          ),
      },
      {
        path: 'imports',
        canActivate: [profilGuard(['super-administrateur'])],
        providers: [provideTranslocoScope('imports')],
        loadComponent: () =>
          import('./features/imports/feature/imports-page/imports-page.component').then(
            (m) => m.ImportsPageComponent,
          ),
      },
      {
        path: 'administration',
        providers: [provideTranslocoScope('administration')],
        loadComponent: () =>
          import('./features/administration/feature/administration-page/administration-page.component').then(
            (m) => m.AdministrationPageComponent,
          ),
      },
      {
        path: 'referentiels/geographique',
        // Alias explicite : un nom de portée avec tirets serait transformé par Transloco dans les clés.
        providers: [provideTranslocoScope({ scope: 'referentiel-geo', alias: 'referentiel_geo' })],
        loadComponent: () =>
          import('./features/referentiel-geo/feature/referentiel-geo-page/referentiel-geo-page.component').then(
            (m) => m.ReferentielGeoPageComponent,
          ),
      },
      {
        path: 'referentiels/cooperatives',
        // Alias explicite : un nom de portée avec tirets serait transformé par Transloco dans les clés.
        providers: [provideTranslocoScope({ scope: 'referentiel-cooperatives', alias: 'referentiel_cooperatives' })],
        loadComponent: () =>
          import('./features/referentiel-cooperatives/feature/cooperatives-page/cooperatives-page.component').then(
            (m) => m.CooperativesPageComponent,
          ),
      },
      {
        path: 'referentiels/parcelles',
        // Alias explicite : un nom de portée avec tirets serait transformé par Transloco dans les clés.
        providers: [provideTranslocoScope({ scope: 'referentiel-parcelle', alias: 'referentiel_parcelle' })],
        loadComponent: () =>
          import('./features/referentiel-parcelle/feature/parcelles-page/parcelles-page.component').then(
            (m) => m.ParcellesPageComponent,
          ),
      },
      {
        path: 'referentiels/producteurs',
        // Alias explicite : un nom de portée avec tirets serait transformé par Transloco dans les clés.
        providers: [provideTranslocoScope({ scope: 'referentiel-producteurs', alias: 'referentiel_producteurs' })],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/referentiel-producteurs/feature/producteurs-page/producteurs-page.component').then(
                (m) => m.ProducteursPageComponent,
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import(
                './features/referentiel-producteurs/feature/fiche-producteur-page/fiche-producteur-page.component'
              ).then((m) => m.FicheProducteurPageComponent),
          },
        ],
      },
      {
        path: 'analyse-zones',
        providers: [provideTranslocoScope({ scope: 'analyse-zones', alias: 'analyse_zones' })],
        loadComponent: () =>
          import('./features/analyse-zones/feature/analyse-zones-page/analyse-zones-page.component').then(
            (m) => m.AnalyseZonesPageComponent,
          ),
      },
      {
        path: 'echantillonnage',
        providers: [provideTranslocoScope('echantillonnage')],
        loadComponent: () =>
          import('./features/echantillonnage/feature/echantillonnage-page/echantillonnage-page.component').then(
            (m) => m.EchantillonnagePageComponent,
          ),
      },
      {
        path: 'observations',
        providers: [provideTranslocoScope('observations')],
        loadComponent: () =>
          import('./features/observations/feature/observations-page/observations-page.component').then(
            (m) => m.ObservationsPageComponent,
          ),
      },
      {
        path: 'cartographie',
        providers: [provideTranslocoScope('cartographie')],
        loadComponent: () =>
          import('./features/cartographie/feature/cartographie-page/cartographie-page.component').then(
            (m) => m.CartographiePageComponent,
          ),
      },
    ],
  },
];
