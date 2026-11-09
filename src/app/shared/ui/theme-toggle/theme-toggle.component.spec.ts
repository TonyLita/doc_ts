import { TestBed } from '@angular/core/testing';
import { fournirTraductionsDeTests } from '../../../core/i18n/traductions-tests';
import { LangueService } from '../../../core/i18n/langue.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['fr-FR']);
  });

  afterEach(() => vi.restoreAllMocks());

  async function setup() {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [fournirTraductionsDeTests()],
    }).compileComponents();
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    return {
      fixture,
      root,
      icone: () => root.querySelector('svg')!.getAttribute('data-icone'),
      texteLecteur: () => root.querySelector('.sr-only')!.textContent?.trim(),
      switchButton: root.querySelector('[role="switch"]') as HTMLButtonElement,
    };
  }

  it('affiche une lune en mode sombre et un soleil en mode clair', async () => {
    const { fixture, icone, switchButton } = await setup();
    expect(icone()).toBe('lune');

    switchButton.click();
    fixture.detectChanges();

    expect(icone()).toBe('soleil');
  });

  it('dessine bien la forme de chaque icône', async () => {
    const { fixture, root, switchButton } = await setup();
    expect(root.querySelectorAll('svg path')).toHaveLength(1);
    expect(root.querySelectorAll('svg circle')).toHaveLength(0);

    switchButton.click();
    fixture.detectChanges();

    expect(root.querySelectorAll('svg circle')).toHaveLength(1);
    expect(root.querySelectorAll('svg line')).toHaveLength(8);
  });

  it('ne laisse pas de texte visible : le mode reste annoncé aux lecteurs d’écran', async () => {
    const { fixture, texteLecteur, switchButton } = await setup();
    expect(texteLecteur()).toBe('Mode sombre');

    switchButton.click();
    fixture.detectChanges();

    expect(texteLecteur()).toBe('Mode clair');
  });

  it('switches the theme when the switch is clicked', async () => {
    const { fixture, switchButton } = await setup();
    expect(switchButton.getAttribute('aria-checked')).toBe('false');

    switchButton.click();
    fixture.detectChanges();

    expect(TestBed.inject(ThemeService).theme()).toBe('light');
    expect(switchButton.getAttribute('aria-checked')).toBe('true');
  });

  it('porte l’icône dans le switch lui-même, sans élément cliquable à côté', async () => {
    const { root, switchButton } = await setup();

    expect(switchButton.querySelector('svg')).not.toBeNull();
    expect(root.querySelectorAll('button')).toHaveLength(1);
    expect(root.querySelectorAll('svg')).toHaveLength(1);
  });

  it('déplace la pastille avec le mode', async () => {
    const { fixture, switchButton } = await setup();
    const pastille = switchButton.querySelector('span[aria-hidden="true"]')!;
    expect(pastille.classList.contains('translate-x-[28px]')).toBe(false);

    switchButton.click();
    fixture.detectChanges();

    expect(pastille.classList.contains('translate-x-[28px]')).toBe(true);
  });

  it('suit la langue active', async () => {
    const { fixture, texteLecteur, switchButton } = await setup();

    TestBed.inject(LangueService).changerLangue('en');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(texteLecteur()).toBe('Dark mode');
    expect(switchButton.getAttribute('aria-label')).toBe('Light theme');
  });
});
