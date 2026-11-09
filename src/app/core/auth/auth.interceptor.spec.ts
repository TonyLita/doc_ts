import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('ajoute l’en-tête Authorization quand un jeton existe', () => {
    TestBed.inject(AuthService).setToken('abc');

    http.get('/api/test').subscribe();

    
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush({});
  });

  it('n’envoie jamais le jeton à un autre service que l’API (ex. l’IA locale)', () => {
    TestBed.inject(AuthService).setToken('abc');

    http.post('http://localhost:11434/api/generate', {}).subscribe();

    const req = httpMock.expectOne('http://localhost:11434/api/generate');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('n’ajoute pas d’en-tête sans jeton', () => {
    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
