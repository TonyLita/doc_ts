import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTranslocoScope } from '@jsverse/transloco';
import { LangueService } from '../../../../core/i18n/langue.service';
import { fournirTraductionsDeTests } from '../../../../core/i18n/traductions-tests';
import { construireTableauDeBordMock } from '../../../../donnee_Mock/tableau-de-bord-mock';
import { urlTableauDeBord } from '../../data-access/tableau-de-bord.service';
import { TableauDeBordPageComponent } from './tableau-de-bord-page.component';

describe('TableauDeBordPageComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['fr-FR']);
  });

  afterEach(() => vi.restoreAllMocks());

  async function preparer() {
    await TestBed.configureTestingModule({
      imports: [TableauDeBordPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        fournirTraductionsDeTests(),
        provideTranslocoScope({ scope: 'tableau-de-bord', alias: 'tableau_de_bord' }),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TableauDeBordPageComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    return { fixture, http, racine: fixture.nativeElement as HTMLElement };
  }

  // Répond à la requête en attente comme le ferait le serveur, puis laisse l'affichage se mettre à jour.
  async function repondre(
    fixture: Awaited<ReturnType<typeof preparer>>['fixture'],
    http: HttpTestingController,
    filtres: { campagne?: string; cooperative?: string } = {},
  ) {
    http.expectOne((r) => r.url === urlTableauDeBord).flush(construireTableauDeBordMock(filtres));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('affiche le titre traduit', async () => {
    const { fixture, http, racine } = await preparer();
    await repondre(fixture, http);

    expect(racine.querySelector('h1')?.textContent).toContain('Tableau de bord');
  });

  it('suit la langue active', async () => {
    const { fixture, http, racine } = await preparer();
    await repondre(fixture, http);

    TestBed.inject(LangueService).changerLangue('en');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(racine.querySelector('h1')?.textContent).toContain('Dashboard');
  });

  it('indique le chargement tant que le serveur n’a pas répondu', async () => {
    const { fixture, http, racine } = await preparer();
    fixture.detectChanges();

    expect(racine.querySelector('[role="status"]')?.textContent).toContain('Chargement');
    await repondre(fixture, http);
    expect(racine.querySelector('[role="status"]')).toBeNull();
  });

  it('affiche les 7 indicateurs, les 2 graphiques et la synthèse du CDC', async () => {
    const { fixture, http, racine } = await preparer();
    await repondre(fixture, http);

    expect(racine.querySelectorAll('app-carte-indicateur')).toHaveLength(6);
    expect(racine.querySelectorAll('app-statut-mois')).toHaveLength(1);
    expect(racine.querySelectorAll('app-graphique-floraison')).toHaveLength(1);
    expect(racine.querySelectorAll('app-graphique-zones')).toHaveLength(1);
    expect(racine.querySelector('app-bloc-synthese')?.textContent).toContain('Campagne 2026');
  });

  it('recharge les données de la coopérative choisie', async () => {
    const { fixture, http, racine } = await preparer();
    await repondre(fixture, http);

    const liste = racine.querySelectorAll('select')[1];
    liste.value = 'coop-sava';
    liste.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const requete = http.expectOne((r) => r.url === urlTableauDeBord);
    expect(requete.request.params.get('cooperative')).toBe('coop-sava');
    requete.flush(construireTableauDeBordMock({ cooperative: 'coop-sava' }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('app-bloc-synthese')?.textContent).toContain('Campagne 2026');
  });

  it('affiche une erreur avec un bouton pour réessayer', async () => {
    const { fixture, http, racine } = await preparer();
    http.expectOne((r) => r.url === urlTableauDeBord).flush('', { status: 500, statusText: 'Erreur' });
    await Promise.resolve();
    fixture.detectChanges();

    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Impossible de charger');
    expect(racine.querySelector('[role="alert"] button')).not.toBeNull();
  });

  it('ne contient que son contenu : ni sidebar, ni header (fournis par la coquille)', async () => {
    const { fixture, http, racine } = await preparer();
    await repondre(fixture, http);

    expect(racine.querySelector('nav')).toBeNull();
    expect(racine.querySelector('header')).toBeNull();
    expect(racine.querySelector('main')).toBeNull();
  });
});
