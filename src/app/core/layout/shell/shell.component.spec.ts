import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslocoScope } from '@jsverse/transloco';
import { fournirTraductionsDeTests } from '../../i18n/traductions-tests';
import { ShellComponent } from './shell.component';

@Component({
  template: '<p>contenu de la page</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PageFactice {}

describe('ShellComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['fr-FR']);
    TestBed.configureTestingModule({
      providers: [
        fournirTraductionsDeTests(),
        provideTranslocoScope('layout'),
        provideRouter([
          { path: '', component: ShellComponent, children: [{ path: 'page', component: PageFactice }] },
        ]),
      ],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  async function ouvrirPage() {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/page');
    await harness.fixture.whenStable();
    harness.detectChanges();
    return { racine: harness.routeNativeElement as HTMLElement, harness };
  }

  it('organise la page : header, puis sidebar, puis contenu', async () => {
    const { racine } = await ouvrirPage();

    const zones = Array.from(racine.querySelectorAll('app-header, app-sidebar, main')).map(
      (element) => element.tagName.toLowerCase(),
    );

    expect(zones).toEqual(['app-header', 'app-sidebar', 'main']);
  });

  it('range le bouton de menu et le logo à gauche du header, puis la langue et le thème', async () => {
    const { racine } = await ouvrirPage();
    const bande = racine.querySelector('app-header .bande-entete')!;

    expect(Array.from(bande.children).map((element) => element.tagName.toLowerCase())).toEqual([
      'app-bouton-menu',
      'app-logo',
      'app-selecteur-langue',
      'app-theme-toggle',
      'app-menu-utilisateur',
    ]);
  });

  it('le logo du header est un seul bloc icône + texte', async () => {
    const { racine } = await ouvrirPage();

    expect(racine.querySelectorAll('app-header .logo-soatech')).toHaveLength(1);
  });

  it('masque la sidebar quand le bouton de menu est cliqué', async () => {
    const { racine, harness } = await ouvrirPage();
    const sidebar = racine.querySelector('app-sidebar') as HTMLElement;
    expect(sidebar.hidden).toBe(false);

    (racine.querySelector('app-bouton-menu button') as HTMLButtonElement).click();
    harness.detectChanges();

    expect(sidebar.hidden).toBe(true);
  });

  it('affiche le contenu de la page courante dans la zone de contenu', async () => {
    const { racine } = await ouvrirPage();

    expect(racine.querySelector('main')?.textContent).toContain('contenu de la page');
  });

  it('ne met ni header ni sidebar dans la zone de contenu', async () => {
    const { racine } = await ouvrirPage();
    const contenu = racine.querySelector('main')!;

    expect(contenu.querySelector('header, nav')).toBeNull();
  });
});
