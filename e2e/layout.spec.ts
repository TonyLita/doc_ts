import { expect, test } from '@playwright/test';
import { seConnecter } from './aides';

// Répartition de la page (core/layout) : header en haut, sidebar à gauche, contenu à droite.
// Positions mesurées dans le navigateur ; le viewport par défaut (1280 px) dépasse le seuil « lg » (1024 px).
test.describe('coquille applicative', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/connexion');
    await seConnecter(page, 'admin', 'admin123');
    await expect(page).toHaveURL(/\/tableau-de-bord$/);
  });

  test('pages protégées : header en haut, sidebar à gauche, contenu à droite', async ({ page }) => {
    const header = (await page.getByRole('banner').boundingBox())!;
    const sidebar = (await page.getByRole('navigation', { name: 'Navigation principale' }).boundingBox())!;
    const contenu = (await page.getByRole('main').boundingBox())!;

    // Le header est au-dessus de la sidebar et du contenu.
    expect(header.y + header.height).toBeLessThanOrEqual(sidebar.y + 0.5);
    expect(header.y + header.height).toBeLessThanOrEqual(contenu.y + 0.5);
    // La sidebar est à gauche du contenu, sans le recouvrir.
    expect(sidebar.x + sidebar.width).toBeLessThanOrEqual(contenu.x + 0.5);
    // Le header occupe toute la largeur.
    expect(header.width).toBeGreaterThan(sidebar.width + contenu.width - 1);
  });

  test('le contenu du tableau de bord est dans la zone de contenu', async ({ page }) => {
    await expect(page.getByRole('main').getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
    await expect(page.getByRole('navigation').getByRole('heading')).toHaveCount(0);
  });

  test('header : bouton de menu à gauche, puis le logo, puis la langue et le thème à droite', async ({
    page,
  }) => {
    const boutonMenu = (await page.getByRole('button', { name: 'Réduire le menu' }).boundingBox())!;
    const logo = (await page.locator('.logo-soatech').boundingBox())!;
    const langue = (await page.getByRole('combobox', { name: 'Langue' }).boundingBox())!;
    const theme = (await page.getByRole('switch').boundingBox())!;

    expect(boutonMenu.x + boutonMenu.width).toBeLessThanOrEqual(logo.x + 0.5);
    expect(logo.x + logo.width).toBeLessThanOrEqual(langue.x + 0.5);
    expect(langue.x + langue.width).toBeLessThanOrEqual(theme.x + 0.5);
  });

  test('logo : l’icône et le texte forment un seul bloc, côte à côte et alignés', async ({ page }) => {
    const bloc = page.locator('.logo-soatech');
    const boite = (await bloc.boundingBox())!;
    // Mode sombre par défaut : seul le texte pour fond sombre est affiché.
    const icone = (await bloc.locator('img[src$="soatech-icon.png"]').boundingBox())!;
    const texte = (await bloc.locator('img:visible').last().boundingBox())!;

    await expect(bloc.locator('img:visible')).toHaveCount(2);
    // Côte à côte : l'icône est à gauche du texte, sans le chevaucher.
    expect(icone.x + icone.width).toBeLessThanOrEqual(texte.x + 0.5);
    // Alignés sur le même axe vertical.
    expect(icone.y + icone.height / 2).toBeCloseTo(texte.y + texte.height / 2, 0);
    // Même hauteur : les deux images dérivent de la taille unique du bloc.
    expect(icone.height).toBeCloseTo(texte.height, 0);
    // Tout est contenu dans le même bloc.
    for (const partie of [icone, texte]) {
      expect(partie.x).toBeGreaterThanOrEqual(boite.x - 0.5);
      expect(partie.x + partie.width).toBeLessThanOrEqual(boite.x + boite.width + 0.5);
      expect(partie.y).toBeGreaterThanOrEqual(boite.y - 0.5);
      expect(partie.y + partie.height).toBeLessThanOrEqual(boite.y + boite.height + 0.5);
    }
  });

  test('le bouton de menu réduit la sidebar puis la ré-affiche, et le contenu s’élargit', async ({
    page,
  }) => {
    const menu = page.getByRole('navigation', { name: 'Navigation principale' });
    const largeurAvant = (await page.getByRole('main').boundingBox())!.width;

    await page.getByRole('button', { name: 'Réduire le menu' }).click();

    await expect(menu).toBeHidden();
    await expect(page.getByRole('button', { name: 'Afficher le menu' })).toHaveAttribute('aria-expanded', 'false');
    expect((await page.getByRole('main').boundingBox())!.width).toBeGreaterThan(largeurAvant + 200);

    await page.getByRole('button', { name: 'Afficher le menu' }).click();

    await expect(menu).toBeVisible();
    await expect(page.getByRole('button', { name: 'Réduire le menu' })).toHaveAttribute('aria-expanded', 'true');
  });

  test('page de connexion (publique) : le header sans sidebar, sans bouton de menu ni logo de header', async ({
    page,
  }) => {
    await page.goto('/connexion');

    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('navigation')).toHaveCount(0);
    await expect(page.locator('header .logo-soatech')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /menu/i })).toHaveCount(0);
  });
});
