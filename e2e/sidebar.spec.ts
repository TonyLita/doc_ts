import { expect, test } from '@playwright/test';
import { seConnecter } from './aides';

test.describe('sidebar du tableau de bord', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/connexion');
    await seConnecter(page, 'admin', 'admin123');
    await expect(page).toHaveURL(/\/tableau-de-bord$/);
  });

  test('range les menus en groupes, repliés au départ', async ({ page }) => {
    const menu = page.getByRole('navigation', { name: 'Navigation principale' });
    const groupes = menu.getByRole('button');

    await expect(groupes).toHaveText([
      'Opérations terrain',
      'Analyses & rapports',
      'Référentiels',
      'Gestion des données',
      'Système',
    ]);
    // Seule l'entrée sans groupe est visible tant qu'aucun groupe n'est ouvert.
    await expect(menu.getByRole('listitem')).toHaveText(['Tableau de bord']);
  });

  test('ouvre plusieurs groupes à la fois et affiche les 15 menus dans l’ordre', async ({ page }) => {
    const menu = page.getByRole('navigation', { name: 'Navigation principale' });

    for (const groupe of await menu.getByRole('button').all()) {
      await groupe.click();
    }

    await expect(menu.getByRole('listitem')).toHaveCount(15);
    await expect(menu.getByRole('listitem').first()).toHaveText('Tableau de bord');
    await expect(menu.getByRole('listitem').last()).toHaveText('Administration');
    await expect(menu.getByRole('button', { name: 'Système' })).toHaveAttribute('aria-expanded', 'true');
  });

  test('signale le tableau de bord comme page courante', async ({ page }) => {
    const menu = page.getByRole('navigation', { name: 'Navigation principale' });

    await expect(menu.getByRole('link', { name: 'Tableau de bord' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('chaque entrée du groupe Référentiels mène à sa page, Parcelles comprise', async ({ page }) => {
    const menu = page.getByRole('navigation', { name: 'Navigation principale' });

    await menu.getByRole('button', { name: 'Référentiels' }).click();
    // Tableau de bord, plus les quatre liens du groupe ouvert.
    await expect(menu.getByRole('link')).toHaveCount(5);
    await menu.getByRole('link', { name: 'Parcelles', exact: true }).click();

    await expect(page).toHaveURL(/\/referentiels\/parcelles$/);
  });

  test('mène Import / Export à la page d’import et le signale comme page courante', async ({ page }) => {
    const menu = page.getByRole('navigation', { name: 'Navigation principale' });

    await menu.getByRole('button', { name: 'Gestion des données' }).click();
    await menu.getByRole('link', { name: 'Import / Export' }).click();
    await expect(page).toHaveURL(/\/imports$/);
    await expect(menu.getByRole('link', { name: 'Import / Export' })).toHaveAttribute('aria-current', 'page');
  });

  test('Import / Export : deux onglets, Import actif par défaut, chacun mène à sa page', async ({ page }) => {
    const menu = page.getByRole('navigation', { name: 'Navigation principale' });
    await menu.getByRole('button', { name: 'Gestion des données' }).click();
    await menu.getByRole('link', { name: 'Import / Export' }).click();

    await expect(page).toHaveURL(/\/imports$/);
    const onglets = page.getByRole('tablist', { name: 'Import et export' });
    await expect(onglets.getByRole('tab')).toHaveText(['Import', 'Export']);
    await expect(onglets.getByRole('tab', { name: 'Import' })).toHaveAttribute('aria-selected', 'true');

    await onglets.getByRole('tab', { name: 'Export' }).click();
    await expect(page).toHaveURL(/\/exports$/);
    await expect(page.getByRole('tab', { name: 'Export' })).toHaveAttribute('aria-selected', 'true');

    await page.getByRole('tab', { name: 'Import' }).click();
    await expect(page).toHaveURL(/\/imports$/);
  });

  test('les menus suivent la langue choisie', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Langue' }).selectOption('en');

    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }).getByRole('listitem').first(),
    ).toHaveText('Dashboard');
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button').first(),
    ).toHaveText('Field operations');
  });
});
