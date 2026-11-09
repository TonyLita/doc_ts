
import { expect, Page, test } from '@playwright/test';
import { seConnecter } from './aides';

// Rapports IA (CDC §8.13) : génération par l'IA locale Ollama (mode « local » de l'environnement de développement).
// Ollama est simulé : ces tests ne dépendent pas d'un Ollama installé.
const urlOllama = 'http://localhost:11434/api/generate';
const entetesCors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };

const markdown = [
  '# Synthèse 2026',
  '',
  'La floraison est **en avance** sur le littoral.',
  '',
  '- Sambava : 43 % du quota',
  '- Mahalevona : 49 % du quota',
  '',
  '<script>window.__xss = 1</script><img src="x" onerror="window.__xss = 1">',
].join('\n');

async function ouvrirRapportsIa(page: Page) {
  await page.goto('/connexion');
  await seConnecter(page, 'admin', 'admin123');
  const menu = page.getByRole('navigation', { name: 'Navigation principale' });
  await menu.getByRole('button', { name: 'Analyses & rapports' }).click();
  await menu.getByRole('link', { name: 'Rapports IA' }).click();
  await expect(page).toHaveURL(/\/rapports-ia$/);
  await expect(page.getByRole('button', { name: 'Générer' })).toBeVisible();
}

test.describe('rapports IA', () => {
  test('le rapport de l\'IA locale s\'affiche en Markdown assaini, après un squelette de chargement', async ({ page }) => {
    let requeteOllama: { headers: Record<string, string>; corps: { model: string; system: string; prompt: string } } | undefined;
    await page.route(urlOllama, async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: entetesCors });
      }
      requeteOllama = { headers: route.request().headers(), corps: route.request().postDataJSON() };
      await new Promise((resolve) => setTimeout(resolve, 700));
      return route.fulfill({ status: 200, headers: entetesCors, contentType: 'application/json', body: JSON.stringify({ response: markdown, done: true }) });
    });
    await ouvrirRapportsIa(page);

    await page.getByRole('radio', { name: 'Synthèse' }).check();
    await page.getByLabel('Instructions complémentaires').fill('Insiste sur les quotas.');
    await page.getByRole('button', { name: 'Générer' }).click();

    // Pendant l'attente : bouton bloqué et squelette qui clignote.
    await expect(page.getByRole('button', { name: 'Génération…' })).toBeDisabled();
    await expect(page.locator('[class*="animate-pulse"]')).toBeVisible();

    // Ensuite : le Markdown est mis en forme.
    const rapport = page.locator('markdown.rapport');
    await expect(rapport.getByRole('heading', { level: 1, name: 'Synthèse 2026' })).toBeVisible();
    await expect(rapport.locator('strong')).toHaveText('en avance');
    await expect(rapport.getByRole('listitem')).toHaveText(['Sambava : 43 % du quota', 'Mahalevona : 49 % du quota']);
    await expect(page.locator('[class*="animate-pulse"]')).toHaveCount(0);

    // Le HTML dangereux du modèle est neutralisé.
    await expect(rapport.locator('script')).toHaveCount(0);
    await expect(rapport.locator('[onerror]')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();

    // La demande part vers Ollama sans le jeton de l'application, rôle et demande séparés.
    expect(requeteOllama?.headers['authorization']).toBeUndefined();
    expect(requeteOllama?.corps.system).toContain('Tu es un expert data');
    expect(requeteOllama?.corps.prompt).toContain('Insiste sur les quotas.');
    expect(requeteOllama?.corps.prompt).toContain('OP Mahalevona');
  });

  test('Ollama éteint : message d\'indisponibilité et possibilité de réessayer', async ({ page }) => {
    await page.route(urlOllama, (route) => route.abort('connectionrefused'));
    await ouvrirRapportsIa(page);

    await page.getByRole('button', { name: 'Générer' }).click();

    await expect(page.getByText('Le service de génération est indisponible pour le moment.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Générer' })).toBeEnabled();
  });
});
