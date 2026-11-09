import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../../core/auth/auth.service';
import { cleMessageErreurConnexion, ConnexionService } from './connexion.service';

describe('ConnexionService', () => {
  const identifiants = { identifiant: 'alice', motDePasse: 'secret' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('envoie les identifiants à l’API de connexion', () => {
    TestBed.inject(ConnexionService).seConnecter(identifiants).subscribe();

    const requete = TestBed.inject(HttpTestingController).expectOne('/api/auth/connexion');

    expect(requete.request.method).toBe('POST');
    expect(requete.request.body).toEqual(identifiants);
    requete.flush({ jeton: 'abc' });
  });

  it('garde le jeton reçu en mémoire', () => {
    TestBed.inject(ConnexionService).seConnecter(identifiants).subscribe();

    TestBed.inject(HttpTestingController).expectOne('/api/auth/connexion').flush({ jeton: 'abc' });

    expect(TestBed.inject(AuthService).token()).toBe('abc');
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
  });

  it('ne garde aucun jeton quand la connexion échoue', () => {
    TestBed.inject(ConnexionService)
      .seConnecter(identifiants)
      .subscribe({ error: () => undefined });

    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/connexion')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
  });
});

describe('cleMessageErreurConnexion', () => {
  it.each([
    [401, 'connexion.erreur_identifiants'],
    [0, 'connexion.erreur_reseau'],
    [500, 'connexion.erreur_inconnue'],
    [403, 'connexion.erreur_inconnue'],
  ])('statut %i : %s', (statut, cleAttendue) => {
    expect(cleMessageErreurConnexion(statut)).toBe(cleAttendue);
  });
});
