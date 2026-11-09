import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../core/api/error.interceptor';
import { AppError } from '../core/api/app-error';
import { AuthService } from '../core/auth/auth.service';
import { ConnexionService, urlConnexion } from '../features/auth/data-access/connexion.service';
import { comptesMock } from './comptes-mock';
import { connexionMockInterceptor, delaiSimuleMs } from './connexion-mock.interceptor';
import { fournirIntercepteursMock } from './fournir-intercepteurs-mock';

describe('connexionMockInterceptor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor, connexionMockInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });

  afterEach(() => vi.useRealTimers());

  it.each(comptesMock)('connecte le compte $profil et renvoie un jeton', async (compte) => {
    const service = TestBed.inject(ConnexionService);
    let jeton = '';

    service
      .seConnecter({ identifiant: compte.identifiant, motDePasse: compte.motDePasse })
      .subscribe((reponse) => (jeton = reponse.jeton));
    await vi.advanceTimersByTimeAsync(delaiSimuleMs);

    expect(jeton).toMatch(new RegExp(`^mock-${compte.identifiant}-\\d+$`));
    expect(TestBed.inject(AuthService).token()).toBe(jeton);
  });

  it.each([
    ['mot de passe incorrect', { identifiant: 'admin', motDePasse: 'faux' }],
    ['identifiant inconnu', { identifiant: 'inconnu', motDePasse: 'admin123' }],
    ['mot de passe d’un autre compte', { identifiant: 'admin', motDePasse: 'agro123' }],
    ['champs vides', { identifiant: '', motDePasse: '' }],
  ])('refuse avec une erreur 401 : %s', async (_cas, identifiants) => {
    let erreur: AppError | undefined;

    TestBed.inject(ConnexionService)
      .seConnecter(identifiants)
      .subscribe({ error: (e: AppError) => (erreur = e) });
    await vi.advanceTimersByTimeAsync(delaiSimuleMs);

    expect(erreur?.status).toBe(401);
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
  });

  it('simule la durée du serveur : pas de réponse avant le délai', async () => {
    let reponse = false;

    TestBed.inject(ConnexionService)
      .seConnecter({ identifiant: 'admin', motDePasse: 'admin123' })
      .subscribe(() => (reponse = true));
    await vi.advanceTimersByTimeAsync(delaiSimuleMs - 1);

    expect(reponse).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(reponse).toBe(true);
  });

  it('laisse passer les autres requêtes vers le réseau', () => {
    TestBed.inject(HttpClient).get('/api/autre').subscribe();

    TestBed.inject(HttpTestingController).expectOne('/api/autre').flush({});
  });

  it('laisse passer un POST vers une autre URL', () => {
    TestBed.inject(HttpClient).post('/api/autre', {}).subscribe();

    TestBed.inject(HttpTestingController).expectOne('/api/autre').flush({});
  });

  it('ne répond pas aux requêtes de connexion en GET', () => {
    TestBed.inject(HttpClient).get(urlConnexion).subscribe();

    TestBed.inject(HttpTestingController).expectOne(urlConnexion).flush({});
  });
});

describe('fournirIntercepteursMock', () => {
  it('active le mock en mode développement', () => {
    expect(fournirIntercepteursMock()).toHaveLength(17);
  });
});
