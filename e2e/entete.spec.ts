import { expect, Page, test } from '@playwright/test';
import { seConnecter } from './aides';

// Règle : tout élément d'un header vit dans une « .bande-entete » : même hauteur, même alignement (voir core/layout/layout.css).
// Ce test mesure la mise en page réelle ; tout futur header placé dans la bande est contrôlé automatiquement.
const hauteurAttendue = 40; // 2.5rem

interface Boite {
  readonly nom: string;
  readonly haut: number;
  readonly hauteur: number;
  readonly centre: number;
}

async function mesurer(page: Page, selecteur: string): Promise<Boite[]> {
  return page.locator(selecteur).evaluateAll((elements) =>
    elements.map((element) => {
      const rectangle = element.getBoundingClientRect();
      return {
        nom: element.tagName.toLowerCase() + (element.getAttribute('role') ? `[${element.getAttribute('role')}]` : ''),
        haut: rectangle.top,
        hauteur: rectangle.height,
        centre: rectangle.top + rectangle.height / 2,
      };
    }),
  );
}

function verifierMemeBande(boites: Boite[]) {
  expect(boites.length).toBeGreaterThanOrEqual(2);
  for (const boite of boites) {
    expect(boite.hauteur, `hauteur de ${boite.nom}`).toBeCloseTo(hauteurAttendue, 1);
    expect(boite.centre, `axe de ${boite.nom}`).toBeCloseTo(boites[0].centre, 1);
  }
}

async function verifierPage(page: Page) {
  // Attend que la bande soit affichée avant de mesurer (la page se construit après le chargement).
  await page.locator('.bande-entete select').waitFor();
  // Éléments directs de la bande, puis les vrais contrôles (liste déroulante, switch) qu'ils contiennent.
  verifierMemeBande(await mesurer(page, '.bande-entete > *'));
  verifierMemeBande(await mesurer(page, '.bande-entete select, .bande-entete [role="switch"]'));
}

test.describe('bande d’en-tête', () => {
  test('page de connexion : tous les éléments ont la même hauteur et le même axe', async ({
    page,
  }) => {
    await page.goto('/connexion');

    await verifierPage(page);
  });

  test('tableau de bord : tous les éléments ont la même hauteur et le même axe', async ({
    page,
  }) => {
    await page.goto('/connexion');
    await seConnecter(page, 'admin', 'admin123');
    await expect(page).toHaveURL(/\/tableau-de-bord$/);

    await verifierPage(page);
  });
});
