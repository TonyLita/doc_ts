import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { errorInterceptor } from '../../../../core/api/error.interceptor';
import { AuthService } from '../../../../core/auth/auth.service';
import { LangueService } from '../../../../core/i18n/langue.service';
import { fournirTraductionsDeTests } from '../../../../core/i18n/traductions-tests';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['fr-FR']);
  });

  afterEach(() => vi.restoreAllMocks());

  async function preparer() {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        fournirTraductionsDeTests(),
        provideTranslocoScope('connexion'),
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    return { fixture, navigation, api: TestBed.inject(HttpTestingController) };
  }

  const racine = (fixture: ComponentFixture<LoginPageComponent>) =>
    fixture.nativeElement as HTMLElement;

  function saisir(fixture: ComponentFixture<LoginPageComponent>, id: string, valeur: string) {
    const champ = racine(fixture).querySelector<HTMLInputElement>(`#${id}`)!;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
  }

  function valider(fixture: ComponentFixture<LoginPageComponent>) {
    racine(fixture).querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  const remplirEtValider = (fixture: ComponentFixture<LoginPageComponent>) => {
    saisir(fixture, 'login-username', 'alice');
    saisir(fixture, 'login-password', 'secret');
    valider(fixture);
  };

  it('should create the login page', async () => {
    const { fixture } = await preparer();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('affiche le même header que les pages protégées, sans sidebar', async () => {
    const { fixture } = await preparer();
    const page = racine(fixture);

    expect(page.querySelector('app-header header.bande-entete')).not.toBeNull();
    expect(page.querySelector('app-sidebar')).toBeNull();
  });

  it('affiche les textes en français par défaut', async () => {
    const { fixture } = await preparer();
    const texte = racine(fixture).textContent;

    expect(texte).toContain('Connexion');
    expect(texte).toContain('Identifiant');
    expect(texte).toContain('Mot de passe');
    expect(texte).toContain('Se connecter');
    expect(texte).toContain('Plateforme de suivi de');
  });

  it('affiche les textes en anglais après le changement de langue', async () => {
    const { fixture } = await preparer();

    TestBed.inject(LangueService).changerLangue('en');
    await fixture.whenStable();
    fixture.detectChanges();
    const texte = racine(fixture).textContent;

    expect(texte).toContain('Login');
    expect(texte).toContain('Username');
    expect(texte).toContain('Sign in');
    expect(texte).not.toContain('Se connecter');
  });

  it('affiche les textes en malgache après le changement de langue', async () => {
    const { fixture } = await preparer();

    TestBed.inject(LangueService).changerLangue('mg');
    await fixture.whenStable();
    fixture.detectChanges();
    const texte = racine(fixture).textContent;

    expect(texte).toContain('Fidirana');
    expect(texte).toContain('Hiditra');
    expect(texte).not.toContain('Se connecter');
  });

  it('signale les deux champs obligatoires sans appeler le serveur', async () => {
    const { fixture, navigation, api } = await preparer();

    valider(fixture);

    const messages = racine(fixture).querySelectorAll('p[role="alert"]');
    expect(Array.from(messages).map((message) => message.textContent?.trim())).toEqual([
      'Ce champ est obligatoire.',
      'Ce champ est obligatoire.',
    ]);
    api.expectNone('/api/auth/connexion');
    expect(navigation).not.toHaveBeenCalled();
  });

  it('envoie les identifiants, garde le jeton et ouvre le tableau de bord', async () => {
    const { fixture, navigation, api } = await preparer();

    remplirEtValider(fixture);
    const requete = api.expectOne('/api/auth/connexion');
    requete.flush({ jeton: 'abc' });

    expect(requete.request.body).toEqual({ identifiant: 'alice', motDePasse: 'secret' });
    expect(TestBed.inject(AuthService).token()).toBe('abc');
    expect(navigation).toHaveBeenCalledWith('/tableau-de-bord');
  });

  it('désactive le bouton pendant l’envoi', async () => {
    const { fixture, api } = await preparer();
    const bouton = racine(fixture).querySelector<HTMLButtonElement>('button[type="submit"]')!;

    remplirEtValider(fixture);

    expect(bouton.disabled).toBe(true);
    api.expectOne('/api/auth/connexion').flush({ jeton: 'abc' });
  });

  it('affiche un message clair et reste sur la page quand les identifiants sont refusés', async () => {
    const { fixture, navigation, api } = await preparer();
    const bouton = racine(fixture).querySelector<HTMLButtonElement>('button[type="submit"]')!;

    remplirEtValider(fixture);
    api.expectOne('/api/auth/connexion').flush({}, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(racine(fixture).textContent).toContain('Identifiant ou mot de passe incorrect.');
    expect(navigation).not.toHaveBeenCalled();
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
    expect(bouton.disabled).toBe(false);
  });

  it('indique un problème réseau quand le serveur est injoignable', async () => {
    const { fixture, api } = await preparer();

    remplirEtValider(fixture);
    api.expectOne('/api/auth/connexion').error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(racine(fixture).textContent).toContain('vérifiez votre accès réseau');
  });

  it('permet de réessayer après une erreur et efface l’ancien message', async () => {
    const { fixture, navigation, api } = await preparer();

    remplirEtValider(fixture);
    api.expectOne('/api/auth/connexion').flush({}, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    valider(fixture);

    expect(racine(fixture).textContent).not.toContain('Identifiant ou mot de passe incorrect.');
    api.expectOne('/api/auth/connexion').flush({ jeton: 'abc' });
    expect(navigation).toHaveBeenCalledWith('/tableau-de-bord');
  });
});
