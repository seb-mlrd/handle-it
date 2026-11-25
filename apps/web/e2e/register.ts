import type { Page } from '@playwright/test';

export const PASSWORD = 'mot-de-passe-long';

export async function register(page: Page, email: string) {
  await page.goto('/register');
  await page.getByLabel('Nom', { exact: true }).fill('Ada');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirmer le mot de passe', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Créer un compte' }).click();
}
