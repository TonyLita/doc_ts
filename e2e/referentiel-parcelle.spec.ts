import { expect, Page, test } from '@playwright/test';
import { seConnecter } from './aides';

// Référentiel des parcelles (CDC §8.5) : liste, filtres, archivage et droits par profil, avec le faux serveur de test.
async function ouvrirParcelles(page: Page, identifiant: string, motDePasse: string) {
  await page.goto('/connexion');
  await seConnecter(page, identifiant, motDePasse);
  const menu = page.getByRole('navigation', { name: 'Navigation principale' });
  await menu.getByRole('button', { name: 'Référentiels' }).click();
  await menu.getByRole('link', { name: 'Parcelles', exact: true }).click();
  await expect(page).toHaveURL(/\/referentiels\/parcelles$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Parcelles' })).toBeVisible();
  await expect(page.locator('tbody tr').first()).toBeVisible();
}

test.describe('référentiel des parcelles', () => {
  test('Super Administrateur : liste paginée, import et création proposés', async ({ page }) => {
    await ouvrirParcelles(page, 'admin', 'admin123');

    await expect(page.locator('tbody tr')).toHaveCount(20);
    await expect(page.getByRole('button', { name: 'Modifier' })).toHaveCount(20);
    await expect(page.getByRole('button', { name: 'Nouvelle parcelle' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Importer des parcelles' })).toHaveAttribute('href', '/imports');
    await expect(page.getByText(/Page 1 sur \d+ · [\d\s  ]+ parcelles/)).toBeVisible();
  });

  test('le filtre par coopérative ne garde que ses parcelles', async ({ page }) => {
    await ouvrirParcelles(page, 'admin', 'admin123');

    await page.getByLabel('Coopérative').selectOption({ label: 'OP Sava' });

    await expect(page.locator('tbody tr td:nth-child(3)').first()).toHaveText('OP Sava');
    await expect(page.locator('tbody tr td:nth-child(3)', { hasNotText: 'OP Sava' })).toHaveCount(0);
  });

  test('archiver demande confirmation, retire la parcelle des actives et la range dans les archivées', async ({ page }) => {
    await ouvrirParcelles(page, 'admin', 'admin123');
    const premiere = page.locator('tbody tr').first();
    const code = (await premiere.locator('th').innerText()).trim();

    await premiere.getByRole('button', { name: 'Archiver' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Archiver' }).click();

    await expect(page.locator('tbody tr th', { hasText: code })).toHaveCount(0);
    await page.getByLabel('Statut').selectOption({ label: 'Archivées' });
    await expect(page.locator('tbody tr th', { hasText: code })).toHaveCount(1);
    await expect(page.getByRole('button', { name: `Restaurer ${code}` })).toBeVisible();
  });

  test('Utilisateur : consulte la liste sans aucun bouton d’écriture', async ({ page }) => {
    await ouvrirParcelles(page, 'agronome', 'agro123');

    await expect(page.locator('tbody tr')).toHaveCount(20);
    await expect(page.getByRole('button', { name: 'Nouvelle parcelle' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^(Modifier|Archiver|Restaurer)/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Importer des parcelles' })).toHaveCount(0);
  });

  test('Visiteur : identité des producteurs réduite à des initiales', async ({ page }) => {
    await ouvrirParcelles(page, 'partenaire', 'visiteur123');

    await expect(page.getByRole('note')).toContainText('identité des producteurs est réduite');
    await expect(page.locator('tbody tr td:nth-child(2)').first()).toHaveText(/^\p{Lu}\. \p{Lu}\.$/u);
  });
});
