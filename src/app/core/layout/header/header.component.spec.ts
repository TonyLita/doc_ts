import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fournirTraductionsDeTests } from '../../i18n/traductions-tests';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['fr-FR']);
  });

  afterEach(() => vi.restoreAllMocks());

  async function preparer() {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [fournirTraductionsDeTests()],
    }).compileComponents();
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('est un repère « header » qui sert de bande d’en-tête', async () => {
    const racine = await preparer();

    expect(racine.querySelector('header.bande-entete')).not.toBeNull();
  });

  it('range tous ses éléments directement dans la bande (même hauteur, même axe)', async () => {
    const racine = await preparer();
    const bande = racine.querySelector('.bande-entete')!;

    expect(Array.from(bande.children).map((element) => element.tagName.toLowerCase())).toEqual([
      'app-selecteur-langue',
      'app-theme-toggle',
    ]);
  });

  it('place le contenu projeté à gauche, avant la langue et le thème, dans la même bande', async () => {
    @Component({
      imports: [HeaderComponent],
      template: '<app-header><span id="projete">menu</span></app-header>',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class HoteDeTest {}

    await TestBed.configureTestingModule({
      imports: [HoteDeTest],
      providers: [fournirTraductionsDeTests()],
    }).compileComponents();
    const fixture = TestBed.createComponent(HoteDeTest);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const bande = (fixture.nativeElement as HTMLElement).querySelector('.bande-entete')!;

    expect(Array.from(bande.children).map((element) => element.tagName.toLowerCase())).toEqual([
      'span',
      'app-selecteur-langue',
      'app-theme-toggle',
    ]);
  });

  it('propose les trois langues et le bouton de thème', async () => {
    const racine = await preparer();

    expect(racine.querySelectorAll('app-selecteur-langue select option')).toHaveLength(3);
    expect(racine.querySelector('app-theme-toggle [role="switch"]')).not.toBeNull();
  });
});
