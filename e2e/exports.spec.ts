import { expect, Page, test } from '@playwright/test';
import { seConnecter } from './aides';

// Centre d'exports (CDC §8.14) : organisation de la page (en-tête, quatre cartes, aperçus des graphiques) et téléchargements,
// avec le faux serveur de test.
async function ouvrirExports(page: Page) {
  await page.goto('/connexion');
  await seConnecter(page, 'admin', 'admin123');
  const menu = page.getByRole('navigation', { name: 'Navigation principale' });
  await menu.getByRole('button', { name: 'Gestion des données' }).click();
  await menu.getByRole('link', { name: 'Import / Export' }).click();
  await page.getByRole('tablist', { name: 'Import et export' }).getByRole('tab', { name: 'Export' }).click();
  await expect(page).toHaveURL(/\/exports$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Exports' })).toBeVisible();
}

test.describe("centre d'exports", () => {
  test("en-tête, bandeau, quatre cartes d'export et trois aperçus de graphiques", async ({ page }) => {
    await ouvrirExports(page);

    await expect(page.getByText(/Campagne \d{4} · Région /)).toBeVisible();
    await expect(page.locator('.pastille-campagne')).toHaveText(/^\d{4}$/);
    await expect(page.getByRole('link', { name: 'Rapport IA' })).toHaveAttribute('href', '/rapports-ia');
    await expect(page.getByRole('heading', { level: 2, name: "Centre d'exports" })).toBeVisible();

    await expect(page.locator('.grille-exports > app-carte-export h2')).toHaveText([
      'Export Excel',
      'Export Graphiques',
      'Rapport PDF',
      'Résumé presse-papiers',
    ]);
    await expect(page.getByRole('button', { name: /producteurs_\d{4}\.xlsx/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /3 fichiers PNG/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /rapport_vanille_\d{4}\.pdf/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copier le résumé' })).toBeVisible();

    await expect(page.getByRole('heading', { level: 2, name: 'Aperçu graphiques exportables' })).toBeVisible();
    await expect(page.locator('.grille-apercus > app-carte-export h2')).toHaveText([
      'Évolution mensuelle',
      'Répartition zones',
      'Comparaison 3 saisons',
    ]);
    await expect(page.locator('.grille-apercus svg')).toHaveCount(3);
  });

  test('le format choisi change le nom du fichier annoncé, le filtre de zone change les aperçus', async ({ page }) => {
    await ouvrirExports(page);

    await page.getByRole('combobox', { name: /^Format/ }).selectOption('csv');
    await expect(page.getByRole('button', { name: /producteurs_\d{4}\.csv/ })).toBeVisible();

    const legendes = page.locator('.grille-apercus app-graphique-floraison').first();
    await expect(legendes).toContainText('Intermédiaire');
    await page.getByRole('combobox', { name: /^Zone/ }).selectOption({ label: 'Littorale' });
    await expect(legendes).not.toContainText('Intermédiaire');
    await expect(legendes).toContainText('Littorale');
  });

  test('un aperçu se télécharge seul, les trois images ensemble', async ({ page }) => {
    await ouvrirExports(page);
    await expect(page.locator('.grille-apercus svg')).toHaveCount(3);

    const seul = page.waitForEvent('download');
    await page.getByRole('button', { name: /Télécharger le graphique « Répartition zones » en PNG/ }).click();
    expect((await seul).suggestedFilename()).toMatch(/^repartition-zones-\d{4}\.png$/);

    const noms: string[] = [];
    page.on('download', (telechargement) => noms.push(telechargement.suggestedFilename()));
    await page.getByRole('button', { name: /3 fichiers PNG/ }).click();
    await expect.poll(() => noms.length, { timeout: 15000 }).toBe(3);
    expect(noms.map((nom) => nom.replace(/-\d{4}\.png$/, ''))).toEqual([
      'floraison-mensuelle',
      'repartition-zones',
      'comparaison-saisons',
    ]);
  });
});
