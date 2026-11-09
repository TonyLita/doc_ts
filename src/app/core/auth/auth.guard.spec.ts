import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('autorise la navigation quand l’utilisateur est authentifié', () => {
    TestBed.inject(AuthService).setToken('abc');

    expect(runGuard()).toBe(true);
  });

  it('redirige vers /connexion quand l’utilisateur n’est pas authentifié', () => {
    const result = runGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/connexion');
  });

  it('redirige de nouveau après la suppression du jeton', () => {
    const auth = TestBed.inject(AuthService);
    auth.setToken('abc');
    auth.setToken(null);

    expect(runGuard()).toBeInstanceOf(UrlTree);
  });
});
