import { TestBed } from '@angular/core/testing';
import { LangueService } from '../../../core/i18n/langue.service';
import { fournirTraductionsDeTests } from '../../../core/i18n/traductions-tests';
import { SelecteurLangueComponent } from './selecteur-langue.component';

describe('SelecteurLangueComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['fr-FR']);
  });

  afterEach(() => vi.restoreAllMocks());

  async function preparer() {
    await TestBed.configureTestingModule({
      imports: [SelecteurLangueComponent],
      providers: [fournirTraductionsDeTests()],
    }).compileComponents();
    const fixture = TestBed.createComponent(SelecteurLangueComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const liste = (fixture.nativeElement as HTMLElement).querySelector('select')!;
    const options = Array.from(liste.querySelectorAll('option'));
    const choisir = (valeur: string) => {
      liste.value = valeur;
      liste.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };
    return { liste, options, choisir, serviceLangue: TestBed.inject(LangueService) };
  }

  it('est une liste déroulante à trois langues, chacune écrite dans sa propre langue', async () => {
    const { options } = await preparer();

    expect(options.map((option) => option.textContent?.trim())).toEqual([
      'Français',
      'English',
      'Malagasy',
    ]);
    expect(options.map((option) => option.value)).toEqual(['fr', 'en', 'mg']);
  });

  it('a un nom accessible traduit', async () => {
    const { liste } = await preparer();

    expect(liste.getAttribute('aria-label')).toBe('Langue');
  });

  it('sélectionne la langue active', async () => {
    const { liste } = await preparer();

    expect(liste.value).toBe('fr');
  });

  it('change de langue à la sélection et enregistre le choix', async () => {
    const { choisir, serviceLangue } = await preparer();

    choisir('en');

    expect(serviceLangue.langueActive()).toBe('en');
    expect(localStorage.getItem('langue')).toBe('en');
  });

  it('permet de choisir le malgache', async () => {
    const { choisir, serviceLangue } = await preparer();

    choisir('mg');

    expect(serviceLangue.langueActive()).toBe('mg');
  });

  it('ignore une valeur inconnue', async () => {
    const { liste, serviceLangue } = await preparer();
    const option = document.createElement('option');
    option.value = 'xx';
    liste.appendChild(option);

    liste.value = 'xx';
    liste.dispatchEvent(new Event('change'));

    expect(serviceLangue.langueActive()).toBe('fr');
  });
});
