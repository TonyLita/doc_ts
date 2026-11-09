import { TestBed } from '@angular/core/testing';
import { provideTranslocoScope } from '@jsverse/transloco';
import { LangueService } from '../../../i18n/langue.service';
import { fournirTraductionsDeTests } from '../../../i18n/traductions-tests';
import { EtatMenuService } from '../../sidebar/etat-menu.service';
import { BoutonMenuComponent } from './bouton-menu.component';

describe('BoutonMenuComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['fr-FR']);
  });

  afterEach(() => vi.restoreAllMocks());

  async function preparer() {
    await TestBed.configureTestingModule({
      imports: [BoutonMenuComponent],
      providers: [fournirTraductionsDeTests(), provideTranslocoScope('layout')],
    }).compileComponents();
    const fixture = TestBed.createComponent(BoutonMenuComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const bouton = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    return { fixture, bouton, etat: TestBed.inject(EtatMenuService) };
  }

  it('est un seul bouton qui désigne le menu qu’il commande', async () => {
    const { bouton } = await preparer();

    expect(bouton.getAttribute('aria-controls')).toBe('menu-principal');
    expect(bouton.querySelector('svg')).not.toBeNull();
  });

  it('indique que le menu est affiché, puis réduit', async () => {
    const { fixture, bouton } = await preparer();
    expect(bouton.getAttribute('aria-expanded')).toBe('true');
    expect(bouton.getAttribute('aria-label')).toBe('Réduire le menu');

    bouton.click();
    fixture.detectChanges();

    expect(bouton.getAttribute('aria-expanded')).toBe('false');
    expect(bouton.getAttribute('aria-label')).toBe('Afficher le menu');
  });

  it('réduit puis ré-affiche le menu au clic', async () => {
    const { fixture, bouton, etat } = await preparer();

    bouton.click();
    fixture.detectChanges();
    expect(etat.menuReduit()).toBe(true);

    bouton.click();
    fixture.detectChanges();
    expect(etat.menuReduit()).toBe(false);
  });

  it('suit la langue active', async () => {
    const { fixture, bouton } = await preparer();

    TestBed.inject(LangueService).changerLangue('en');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(bouton.getAttribute('aria-label')).toBe('Collapse menu');
  });
});
