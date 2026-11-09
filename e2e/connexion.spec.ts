import { expect, test } from '@playwright/test';
import { comptesMock } from '../src/app/donnee_Mock/comptes-mock';
import { seConnecter } from './aides';

// Sans backend : les comptes viennent du dossier donnee_Mock (intercepteur actif en développement).
// Quand le dossier sera supprimé, ces tests passeront sur le vrai serveur avec des comptes de recette.

test.describe('connexion', () => {
  for (const compte of comptesMock) {
    test(`connexion réussie, profil ${compte.profil} : ouvre le tableau de bord`, async ({
      page,
    }) => {
      await page.goto('/connexion');

      await seConnecter(page, compte.identifiant, compte.motDePasse);

      await expect(page).toHaveURL(/\/tableau-de-bord$/);
      await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
    });
  }

  test('mot de passe incorrect : message clair et reste sur la page de connexion', async ({
    page,
  }) => {
    await page.goto('/connexion');

    await seConnecter(page, 'admin', 'mauvais-mot-de-passe');

    await expect(page.getByText('Identifiant ou mot de passe incorrect.')).toBeVisible();
    await expect(page).toHaveURL(/\/connexion$/);
  });

  test('identifiant inconnu : bloqué avec le même message', async ({ page }) => {
    await page.goto('/connexion');

    await seConnecter(page, 'inconnu', 'admin123');

    await expect(page.getByText('Identifiant ou mot de passe incorrect.')).toBeVisible();
    await expect(page).toHaveURL(/\/connexion$/);
  });

  test('après un refus, une nouvelle tentative correcte réussit', async ({ page }) => {
    await page.goto('/connexion');
    await seConnecter(page, 'admin', 'faux');
    await expect(page.getByText('Identifiant ou mot de passe incorrect.')).toBeVisible();

    await seConnecter(page, 'admin', 'admin123');

    await expect(page).toHaveURL(/\/tableau-de-bord$/);
  });

  test('champs vides : signale les deux champs, sans connexion', async ({ page }) => {
    await page.goto('/connexion');

    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByText('Ce champ est obligatoire.')).toHaveCount(2);
    await expect(page).toHaveURL(/\/connexion$/);
  });

  test('page protégée : le tableau de bord renvoie vers la connexion sans être connecté', async ({
    page,
  }) => {
    await page.goto('/tableau-de-bord');

    await expect(page).toHaveURL(/\/connexion$/);
  });
});
