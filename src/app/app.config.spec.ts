import { TestBed } from '@angular/core/testing';
import { TRANSLOCO_LOADER, TranslocoService } from '@jsverse/transloco';
import { appConfig } from './app.config';
import { ChargeurDeTests } from './core/i18n/traductions-tests';

describe('appConfig', () => {
  it('configure Transloco avec le français, l’anglais et le malgache, en français par défaut', () => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: TRANSLOCO_LOADER, useClass: ChargeurDeTests }],
    });
    const traduction = TestBed.inject(TranslocoService);

    expect(traduction.getAvailableLangs()).toEqual(['fr', 'en', 'mg']);
    expect(traduction.getDefaultLang()).toBe('fr');
    expect(traduction.config.fallbackLang).toBe('fr');
    expect(traduction.config.missingHandler.useFallbackTranslation).toBe(true);
  });
});
