import { expect, Page, test } from '@playwright/test';
import { seConnecter } from './aides';

// Import des référentiels (CDC §8.16) : une zone de dépôt par type, aide en trois étapes, analyse puis annulation,
// avec le faux serveur de test.
async function ouvrirImports(page: Page) {
  await page.goto('/connexion');
  await seConnecter(page, 'admin', 'admin123');
  const menu = page.getByRole('navigation', { name: 'Navigation principale' });
  await menu.getByRole('button', { name: 'Gestion des données' }).click();
  await menu.getByRole('link', { name: 'Import / Export' }).click();
  await expect(page).toHaveURL(/\/imports$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Import des référentiels' })).toBeVisible();
}

const fichierCsv = (nom: string) => ({ name: nom, mimeType: 'text/csv', buffer: Buffer.from('producteur;cooperative\n') });

test.describe('import des référentiels', () => {
  test('bandeau, une zone de dépôt par type et aide en trois étapes', async ({ page }) => {
    await ouvrirImports(page);

    await expect(page.getByRole('heading', { level: 2, name: 'Import de données' })).toBeVisible();
    await expect(page.locator('.grille-depots app-formulaire-import h2')).toHaveText(['Parcelles', 'Coopératives']);
    await expect(page.getByRole('button', { name: 'Choisir le fichier' })).toHaveCount(2);
    await expect(page.getByText('Aucun fichier choisi')).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Analyser le fichier' })).toHaveCount(2);

    await expect(page.getByRole('heading', { level: 2, name: 'Comment importer vos données' })).toBeVisible();
    await expect(page.locator('.etape-aide h3')).toHaveText(['Préparez le fichier', 'Glissez-déposez', 'Vérifiez et validez']);
    await expect(page.getByRole('note')).toContainText("Rien n'est écrit avant votre confirmation");
    await expect(page.getByRole('table', { name: 'Historique des imports' })).toBeVisible();
  });

  test("un fichier choisi dans une zone s'analyse, puis l'import s'annule", async ({ page }) => {
    await ouvrirImports(page);
    const parcelles = page.locator('app-formulaire-import').first();

    await parcelles.locator('input[type=file]').setInputFiles(fichierCsv('parcelles.csv'));
    await expect(parcelles.getByText('parcelles.csv')).toBeVisible();
    await parcelles.getByRole('button', { name: 'Analyser le fichier' }).click();

    await expect(page.getByRole('button', { name: "Confirmer l'import" })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.grille-depots')).toHaveCount(0);
    await expect(page.locator('app-aide-import')).toHaveCount(0);

    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(page.locator('.grille-depots')).toBeVisible();
    await expect(page.getByText('Aucun fichier choisi')).toHaveCount(2);
  });

  test("un format refusé bloque l'analyse de sa zone seulement", async ({ page }) => {
    await ouvrirImports(page);
    const cooperatives = page.locator('app-formulaire-import').nth(1);

    await cooperatives.locator('input[type=file]').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
    await expect(cooperatives.getByRole('alert')).toBeVisible();
    await expect(cooperatives.getByRole('button', { name: 'Analyser le fichier' })).toBeDisabled();
    await expect(page.locator('app-formulaire-import').first().getByRole('alert')).toHaveCount(0);
  });

  test('un fichier glissé dans la zone est retenu', async ({ page }) => {
    await ouvrirImports(page);
    const cooperatives = page.locator('app-formulaire-import').nth(1);

    const transfert = await page.evaluateHandle(() => {
      const donnees = new DataTransfer();
      donnees.items.add(new File(['nom;village;commune\n'], 'cooperatives.csv', { type: 'text/csv' }));
      return donnees;
    });
    await cooperatives.locator('.zone-depot').dispatchEvent('drop', { dataTransfer: transfert });

    await expect(cooperatives.getByText('cooperatives.csv')).toBeVisible();
    await expect(cooperatives.getByRole('button', { name: 'Analyser le fichier' })).toBeEnabled();
  });
});
