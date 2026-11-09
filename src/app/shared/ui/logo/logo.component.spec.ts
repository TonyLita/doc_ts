import { TestBed } from '@angular/core/testing';
import { LogoComponent } from './logo.component';

describe('LogoComponent', () => {
  async function preparer() {
    await TestBed.configureTestingModule({ imports: [LogoComponent] }).compileComponents();
    const fixture = TestBed.createComponent(LogoComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('regroupe l’icône et le texte dans un seul bloc', async () => {
    const racine = await preparer();

    expect(racine.querySelectorAll('.logo-soatech')).toHaveLength(1);
    expect(racine.querySelectorAll('.logo-soatech > img').length).toBeGreaterThanOrEqual(2);
    expect(racine.querySelectorAll('img')).toHaveLength(
      racine.querySelectorAll('.logo-soatech > img').length,
    );
  });

  it('place l’icône avant le texte', async () => {
    const racine = await preparer();
    const sources = Array.from(racine.querySelectorAll('.logo-soatech > img')).map((image) =>
      image.getAttribute('src'),
    );

    expect(sources[0]).toBe('assets/soatech-icon.png');
    expect(sources.slice(1)).toEqual([
      'assets/soatech-wordmark.png',
      'assets/soatech-wordmark-on-dark.png',
    ]);
  });

  it('propose une version du texte pour chaque thème', async () => {
    const racine = await preparer();
    const [, clair, sombre] = Array.from(racine.querySelectorAll('.logo-soatech > img'));

    expect(clair.classList.contains('dark:hidden')).toBe(true);
    expect(sombre.classList.contains('dark:block')).toBe(true);
  });

  it('nomme le logo pour les lecteurs d’écran et ignore l’icône décorative', async () => {
    const racine = await preparer();
    const [icone, clair] = Array.from(racine.querySelectorAll('.logo-soatech > img'));

    expect(icone.getAttribute('alt')).toBe('');
    expect(clair.getAttribute('alt')).toBe('SoaTech');
  });
});
