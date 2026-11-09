import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { AuthService } from '../../auth/auth.service';
import { Profil } from '../../auth/profil';
import { LangueService } from '../../i18n/langue.service';
import { fournirTraductionsDeTests } from '../../i18n/traductions-tests';
import { elementsMenu } from './elements-menu';
import { EtatMenuService } from './etat-menu.service';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['fr-FR']);
  });

  afterEach(() => vi.restoreAllMocks());

  // Par défaut le Super Administrateur voit toutes les entrées du menu.
  async function preparer(profil: Profil = 'super-administrateur') {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        fournirTraductionsDeTests(),
        provideTranslocoScope('layout'),
        provideRouter([]),
      ],
    }).compileComponents();
    TestBed.inject(AuthService).setProfilCourant(profil);
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      racine,
      // Les entrées (un `li` chacune) dans l'ordre, groupes repliés compris : le texte reste dans la page.
      entrees: () =>
        Array.from(racine.querySelectorAll('nav li')).map((entree) => entree.textContent?.trim()),
      groupes: () =>
        Array.from(racine.querySelectorAll<HTMLButtonElement>('nav button')).map((bouton) => bouton.textContent?.trim()),
    };
  }

  it('affiche les 15 menus dans l’ordre, rangés par groupe', async () => {
    const { entrees } = await preparer();

    expect(entrees()).toEqual([
      'Tableau de bord',
      'Campagnes',
      'Observations',
      'Échantillonnage',
      'Cartographie',
      'Analyse par zone',
      'Rapports IA',
      'Qualité des données',
      'Coopératives',
      'Producteurs',
      'Parcelles',
      'Zones géographiques',
      'Synchronisation',
      'Import / Export',
      'Administration',
    ]);
  });

  it('range les entrées dans cinq groupes, dans l’ordre', async () => {
    const { groupes } = await preparer();

    expect(groupes()).toEqual([
      'Opérations terrain',
      'Analyses & rapports',
      'Référentiels',
      'Gestion des données',
      'Système',
    ]);
  });

  it('a une navigation nommée', async () => {
    const { racine } = await preparer();

    expect(racine.querySelector('nav')?.getAttribute('aria-label')).toBe('Navigation principale');
  });

  it('donne une page à chacune des 15 entrées : aucune n’est désactivée', async () => {
    const { racine } = await preparer();

    const liens = racine.querySelectorAll('nav a');
    const desactivees = racine.querySelectorAll('nav [aria-disabled="true"]');

    expect(liens).toHaveLength(15);
    expect(liens[0].getAttribute('href')).toBe('/tableau-de-bord');
    expect(desactivees).toHaveLength(0);
  });

  it('active une entrée dès qu’elle reçoit une route', () => {
    const avecRoute = elementsMenu.filter((element) => element.route);

    expect(avecRoute.map((element) => element.route)).toEqual(['/tableau-de-bord', '/campagnes', '/observations', '/echantillonnage', '/cartographie', '/analyse-zones', '/rapports-ia', '/qualite-donnees', '/referentiels/cooperatives', '/referentiels/producteurs', '/referentiels/parcelles', '/referentiels/geographique', '/synchronisation', '/imports', '/administration']);
  });

  it('affiche les groupes repliés au départ, puis en ouvre plusieurs à la fois', async () => {
    const { fixture, racine } = await preparer();
    const boutons = Array.from(racine.querySelectorAll<HTMLButtonElement>('nav button'));
    const listes = () => Array.from(racine.querySelectorAll<HTMLElement>('nav ul[id^="menu-groupe-"]'));

    expect(boutons.every((bouton) => bouton.getAttribute('aria-expanded') === 'false')).toBe(true);
    expect(listes().every((liste) => liste.hidden)).toBe(true);

    boutons[0].click();
    boutons[2].click();
    fixture.detectChanges();

    expect(boutons.map((bouton) => bouton.getAttribute('aria-expanded'))).toEqual(['true', 'false', 'true', 'false', 'false']);
    expect(listes().map((liste) => liste.hidden)).toEqual([false, true, false, true, true]);
    expect(boutons[0].getAttribute('aria-controls')).toBe(listes()[0].id);
  });

  it('mène Import / Export à la première page permise au profil, et le masque à qui n’y a pas droit', async () => {
    const administrateur = await preparer('super-administrateur');
    expect(administrateur.racine.querySelector('a[href="/imports"]')?.textContent?.trim()).toBe('Import / Export');
    expect(administrateur.racine.querySelector('a[href="/exports"]')).toBeNull();
    TestBed.resetTestingModule();

    const utilisateur = await preparer('utilisateur');
    expect(utilisateur.racine.querySelector('a[href="/exports"]')?.textContent?.trim()).toBe('Import / Export');
    expect(utilisateur.racine.querySelector('a[href="/imports"]')).toBeNull();
    TestBed.resetTestingModule();

    const visiteur = await preparer('visiteur');
    expect(visiteur.entrees()).not.toContain('Import / Export');
  });

  it('affiche les menus en anglais après le changement de langue', async () => {
    const { fixture, entrees, groupes, racine } = await preparer();

    TestBed.inject(LangueService).changerLangue('en');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(entrees()[0]).toBe('Dashboard');
    expect(entrees()).toHaveLength(15);
    expect(groupes()[0]).toBe('Field operations');
    expect(racine.querySelector('nav')?.getAttribute('aria-label')).toBe('Main navigation');
  });

  it('est identifiable par le bouton qui la commande', async () => {
    const { racine } = await preparer();

    expect(racine.querySelector('nav')?.id).toBe('menu-principal');
  });

  it('se masque quand le menu est réduit et se ré-affiche ensuite', async () => {
    const { fixture, racine } = await preparer();
    const sidebar = racine as HTMLElement;
    expect(sidebar.hidden).toBe(false);

    TestBed.inject(EtatMenuService).basculer();
    fixture.detectChanges();
    expect(sidebar.hidden).toBe(true);

    TestBed.inject(EtatMenuService).basculer();
    fixture.detectChanges();
    expect(sidebar.hidden).toBe(false);
  });

  it('affiche les menus en malgache après le changement de langue', async () => {
    const { fixture, entrees } = await preparer();

    TestBed.inject(LangueService).changerLangue('mg');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(entrees()[4]).toBe('Sarintany');
  });
});
