import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { fournirTraductionsDeTests } from './core/i18n/traductions-tests';
import { construireTableauDeBordMock } from './donnee_Mock/tableau-de-bord-mock';
import { urlTableauDeBord } from './features/dashboard/data-access/tableau-de-bord.service';

// Le tableau de bord charge ses données dès son affichage : on répond comme le ferait le serveur.
function repondreAuTableauDeBord(): void {
  TestBed.inject(HttpTestingController)
    .expectOne((requete) => requete.url === urlTableauDeBord)
    .flush(construireTableauDeBordMock({}));
}

describe('routes', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['fr-FR']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        fournirTraductionsDeTests(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it.each(['/', '/login'])('redirige %s vers /connexion', async (url) => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl(url);

    expect(TestBed.inject(Router).url).toBe('/connexion');
  });

  it('affiche la page de connexion sur /connexion avec ses textes traduits', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/connexion');
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain('Connexion');
    expect(harness.routeNativeElement?.textContent).toContain('Se connecter');
  });

  it('redirige /tableau-de-bord vers /connexion sans être connecté', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/tableau-de-bord');

    expect(TestBed.inject(Router).url).toBe('/connexion');
  });

  it('affiche le tableau de bord, avec ses textes traduits, une fois connecté', async () => {
    TestBed.inject(AuthService).setToken('abc');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/tableau-de-bord');
    repondreAuTableauDeBord();
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/tableau-de-bord');
    expect(harness.routeNativeElement?.textContent).toContain('Tableau de bord');
    // Le menu signale la page courante.
    expect(
      harness.routeNativeElement?.querySelector('nav a[aria-current="page"]')?.textContent,
    ).toContain('Tableau de bord');
  });

  it('place le tableau de bord dans la coquille : header, sidebar et contenu', async () => {
    TestBed.inject(AuthService).setToken('abc');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/tableau-de-bord');
    repondreAuTableauDeBord();
    await harness.fixture.whenStable();
    harness.detectChanges();
    const racine = harness.routeNativeElement as HTMLElement;

    expect(racine.querySelector('app-header')).not.toBeNull();
    expect(racine.querySelector('app-sidebar nav')).not.toBeNull();
    expect(racine.querySelector('main h1')?.textContent).toContain('Tableau de bord');
  });

  it('n’affiche pas la coquille sur la page de connexion (page publique)', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/connexion');
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(harness.routeNativeElement?.querySelector('app-sidebar')).toBeNull();
  });
});
