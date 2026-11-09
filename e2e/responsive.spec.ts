import { expect, test } from '@playwright/test';
import { seConnecter } from './aides';

// Garde-fou du responsive design (core/layout) : aucune page ne doit déborder horizontalement, ni sur un téléphone, ni
// sur une tablette, ni sur un petit portable (1024 px, juste au seuil « lg » où le menu passe à gauche).
// Les pages contrôlées sont celles du menu, lues dans la navigation (même fermée : sous 1024 px elle démarre fermée) :
// une page ajoutée au menu est donc contrôlée sans rien modifier ici. S'y ajoutent les pages qui n'ont pas d'entrée de menu.
const largeurs = [390, 768, 1024];
const pagesHorsMenu = ['/referentiels/producteurs/prd-0001'];

for (const largeur of largeurs) {
  test.describe(`largeur de ${largeur} px`, () => {
    test.use({ viewport: { width: largeur, height: 900 } });

    test('aucune page ne déborde horizontalement', async ({ page }) => {
      await page.goto('/connexion');
      await seConnecter(page, 'admin', 'admin123');
      await expect(page).toHaveURL(/\/tableau-de-bord$/);

      // Pas getByRole : il ignore un menu fermé (masqué), or sous 1024 px le menu démarre fermé après la connexion.
      const liensDuMenu = await page
        .locator('#menu-principal a')
        .evaluateAll((liens) => liens.map((lien) => lien.getAttribute('href') ?? ''));
      const routes = [...new Set([...liensDuMenu, ...pagesHorsMenu])].filter(Boolean);
      expect(routes.length).toBeGreaterThan(10);

      for (const route of routes) {
        await test.step(route, async () => {
          // Navigation interne, sans rechargement : le jeton de session ne vit qu'en mémoire.
          await page.evaluate((chemin) => {
            history.pushState({}, '', chemin);
            dispatchEvent(new PopStateEvent('popstate'));
          }, route);
          await expect(page).toHaveURL(new RegExp(`${route}$`));
          // Le contrôle ne vaut qu'une fois la page affichée : titre présent et message « Chargement… » disparu.
          await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
          await expect(page.locator('.page-contenu--chargement')).toHaveCount(0);
          await expect(page.getByRole('main').getByText(/^Chargement/)).toHaveCount(0);

          const largeurPage = await page.evaluate(() => document.documentElement.scrollWidth);
          expect(largeurPage, `${route} déborde : la page fait ${largeurPage} px pour une fenêtre de ${largeur} px`).toBeLessThanOrEqual(
            largeur,
          );
        });
      }
    });
  });
}
