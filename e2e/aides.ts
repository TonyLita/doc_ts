import { Page } from '@playwright/test';

// Saisit les identifiants sur la page de connexion et valide.
export async function seConnecter(page: Page, identifiant: string, motDePasse: string) {
  await page.getByLabel('Identifiant').fill(identifiant);
  await page.getByLabel('Mot de passe').fill(motDePasse);
  await page.getByRole('button', { name: 'Se connecter' }).click();
}
