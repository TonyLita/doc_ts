import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslocoHttpLoader } from './transloco-http.loader';

describe('TranslocoHttpLoader', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('charge le fichier de traductions de la langue demandée', () => {
    const chargeur = TestBed.inject(TranslocoHttpLoader);
    const controleur = TestBed.inject(HttpTestingController);
    let resultat: unknown;

    chargeur.getTranslation('fr').subscribe((traductions) => (resultat = traductions));
    controleur.expectOne('i18n/fr.json').flush({ commun: { essai: 'ok' } });

    expect(resultat).toEqual({ commun: { essai: 'ok' } });
    controleur.verify();
  });

  it('charge le fichier d’une portée à partir de « <portée>/<langue> »', () => {
    const chargeur = TestBed.inject(TranslocoHttpLoader);
    const controleur = TestBed.inject(HttpTestingController);

    chargeur.getTranslation('connexion/en').subscribe();

    controleur.expectOne('i18n/connexion/en.json').flush({});
    controleur.verify();
  });
});
