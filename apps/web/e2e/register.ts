import type { Page } from '@playwright/test';

export const PASSWORD = 'mot-de-passe-long';

/** Remplit la page d'inscription déjà ouverte. */
export async function fillRegistration(page: Page, email: string, name = 'Ada') {
  await page.getByLabel('Nom', { exact: true }).fill(name);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirmer le mot de passe', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Créer un compte' }).click();
}

export async function register(page: Page, email: string, name?: string) {
  await page.goto('/register');
  await fillRegistration(page, email, name);
}
