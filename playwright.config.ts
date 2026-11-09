import { defineConfig, devices } from '@playwright/test';

// Port dédié aux tests E2E : ils démarrent leur propre serveur, toujours à jour, et ne réutilisent jamais
// un « npm start » ouvert sur 4200 (qui pourrait servir un ancien code et fausser les résultats).
const port = 4300;
const url = `http://localhost:${port}`;

// Tests de bout en bout (manuel 6.5), séparés des tests unitaires Vitest (src/**/*.spec.ts).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  reporter: 'list',
  use: {
    baseURL: url,
    // Les textes attendus par les tests sont en français.
    locale: 'fr-FR',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm start -- --port ${port}`,
    url,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
