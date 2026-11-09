import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { LangueService } from './langue.service';
import { Langue } from './langues';
import { fournirTraductionsDeTests } from './traductions-tests';

describe('LangueService', () => {
  const simulerNavigateur = (langues: string[]) =>
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(langues);

  const creerService = () => {
    TestBed.configureTestingModule({ providers: [fournirTraductionsDeTests()] });
    return TestBed.inject(LangueService);
  };

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
    simulerNavigateur(['fr-FR']);
  });

  afterEach(() => vi.restoreAllMocks());

  it.each<[string[], Langue]>([
    [['en-US', 'fr'], 'en'],
    [['fr-FR'], 'fr'],
    [['mg-MG'], 'mg'],
    [['de-DE', 'en-GB'], 'en'],
    [['de-DE', 'es'], 'fr'],
    [[], 'fr'],
  ])('détecte la langue du navigateur %j : %s', async (languesNavigateur, attendue) => {
    simulerNavigateur(languesNavigateur);
    const service = creerService();

    await service.initialiser();

    expect(service.langueActive()).toBe(attendue);
    expect(document.documentElement.lang).toBe(attendue);
  });

  it('préfère le choix enregistré à la langue du navigateur', async () => {
    simulerNavigateur(['fr-FR']);
    localStorage.setItem('langue', 'en');
    const service = creerService();

    await service.initialiser();

    expect(service.langueActive()).toBe('en');
  });

  it('ignore un choix enregistré invalide', async () => {
    simulerNavigateur(['en-US']);
    localStorage.setItem('langue', 'xx');
    const service = creerService();

    await service.initialiser();

    expect(service.langueActive()).toBe('en');
  });

  it('n’enregistre pas la langue détectée automatiquement', async () => {
    simulerNavigateur(['en-US']);
    const service = creerService();

    await service.initialiser();

    expect(localStorage.getItem('langue')).toBeNull();
  });

  it('change de langue, met à jour <html lang> et enregistre le choix', () => {
    const service = creerService();

    service.changerLangue('en');

    expect(service.langueActive()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('langue')).toBe('en');
  });

  it('refuse une langue inconnue', () => {
    const service = creerService();

    service.changerLangue('xx' as Langue);

    expect(service.langueActive()).toBe('fr');
    expect(localStorage.getItem('langue')).toBeNull();
  });

  it('traduit dans la langue active', async () => {
    const service = creerService();
    const traduction = TestBed.inject(TranslocoService);
    await service.initialiser();

    service.changerLangue('en');
    await firstValueFrom(traduction.load('en'));

    expect(traduction.translate('commun.theme.mode_clair')).toBe('Light mode');
  });

  it('traduit en malgache', async () => {
    const service = creerService();
    const traduction = TestBed.inject(TranslocoService);
    await service.initialiser();

    service.changerLangue('mg');
    await firstValueFrom(traduction.load('mg'));

    expect(traduction.translate('commun.theme.mode_clair')).toBe('Fomba mazava');
  });

  it('affiche le français pour une clé absente de la langue active', async () => {
    const service = creerService();
    const traduction = TestBed.inject(TranslocoService);
    await service.initialiser();

    service.changerLangue('mg');
    await firstValueFrom(traduction.load('mg'));
    traduction.setTranslation({}, 'mg', { merge: false });

    expect(traduction.translate('commun.theme.mode_clair')).toBe('Mode clair');
  });
});
