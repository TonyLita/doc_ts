import { expect, Page, test } from '@playwright/test';
import { seConnecter } from './aides';

// Référentiel des producteurs (CDC §8.4) : tableau par mois, filtre de zone, pagination à numéros et export de la liste,
// avec le faux serveur de test.
async function ouvrirProducteurs(page: Page, identifiant: string, motDePasse: string) {
  await page.goto('/connexion');
  await seConnecter(page, identifiant, motDePasse);
  const menu = page.getByRole('navigation', { name: 'Navigation principale' });
  await menu.getByRole('button', { name: 'Référentiels' }).click();
  await menu.getByRole('link', { name: 'Producteurs', exact: true }).click();
  await expect(page).toHaveURL(/\/referentiels\/producteurs$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Référentiel producteurs' })).toBeVisible();
  await expect(page.locator('tbody tr').first()).toBeVisible();
}

test.describe('référentiel des producteurs', () => {
  test('Super Administrateur : colonnes du tableau, pastilles de zone, actions et pagination à numéros', async ({ page }) => {
    await ouvrirProducteurs(page, 'admin', 'admin123');

    const entetes = page.locator('thead th');
    await expect(entetes).toHaveCount(15);
    await expect(entetes.nth(0)).toHaveText('N°');
    await expect(entetes.nth(2)).toHaveText('Fokontany');
    await expect(entetes.nth(3)).toHaveText('Zone');
    await expect(entetes.nth(4)).toHaveText('Pieds');
    await expect(entetes.nth(5)).toHaveText('Âge');
    await expect(entetes.nth(13)).toHaveText('Total');
    await expect(entetes.nth(14)).toHaveText('Action');

    await expect(page.locator('tbody tr')).toHaveCount(20);
    await expect(page.locator('tbody tr').first().locator('td').first()).toHaveText('1');
    await expect(page.locator('tbody .badge-zone').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^Détails de / })).toHaveCount(20);
    await expect(page.getByRole('button', { name: /^Saisir données floraison de / })).toHaveCount(20);

    await expect(page.getByRole('button', { name: 'Excel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'PDF' })).toBeVisible();

    await expect(page.locator('.pagination__numero--active')).toHaveText('1');
    await page.getByRole('button', { name: '2', exact: true }).click();
    await expect(page.locator('.pagination__numero--active')).toHaveText('2');
    await expect(page.locator('tbody tr').first().locator('td').first()).toHaveText('21');
  });

  test('le filtre de zone ne garde que les producteurs de cette zone', async ({ page }) => {
    await ouvrirProducteurs(page, 'admin', 'admin123');

    await page.getByRole('combobox', { name: /^Zone/ }).selectOption({ label: 'Littorale' });
    await expect(page.locator('tbody .badge-zone').first()).toBeVisible();
    await expect.poll(async () => [...new Set(await page.locator('tbody .badge-zone__nom').allTextContents())]).toEqual(['Littorale']);
    await expect(page.locator('.pagination__resume')).toContainText('Page 1 sur');
  });

  test("l'export de la liste télécharge un fichier Excel (CSV de test) et un PDF", async ({ page }) => {
    await ouvrirProducteurs(page, 'admin', 'admin123');

    const excel = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Excel' }).click();
    expect((await excel).suggestedFilename()).toMatch(/^producteurs_\d{4}\.csv$/);

    const pdf = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF' }).click();
    expect((await pdf).suggestedFilename()).toMatch(/^producteurs_\d{4}\.pdf$/);
  });

  test("Utilisateur : peut exporter mais ne saisit pas ; Visiteur : ni export ni saisie, identité réduite", async ({ page }) => {
    await ouvrirProducteurs(page, 'agronome', 'agro123');
    await expect(page.getByRole('button', { name: 'Excel' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Saisir données floraison de / })).toHaveCount(0);

    await ouvrirProducteurs(page, 'partenaire', 'visiteur123');
    await expect(page.getByRole('button', { name: 'Excel' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'PDF' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Saisir données floraison de / })).toHaveCount(0);
    await expect(page.getByRole('note')).toBeVisible();
  });
});
