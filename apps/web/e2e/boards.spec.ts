import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { PASSWORD, register } from './register';

test('créer, renommer puis supprimer un tableau', async ({ page }) => {
  await register(page, `${randomUUID()}@example.com`);
  await expect(page.getByText('Aucun tableau pour l')).toBeVisible();

  await page.getByRole('button', { name: 'Créer le tableau' }).click();
  await expect(page.getByLabel('Nouveau tableau')).toHaveAccessibleDescription(
    'Le nom du tableau est obligatoire',
  );
  await page.getByLabel('Nouveau tableau').fill('Maison');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Maison' })).toBeVisible();
  await expect(page.getByText('Propriétaire')).toBeVisible();
  await expect(page.getByLabel('Nouveau tableau')).toHaveValue('');

  await page.getByRole('button', { name: 'Actions de Maison' }).click();
  await page.getByRole('button', { name: 'Renommer Maison' }).click();
  await expect(page.getByLabel('Nom du tableau')).toBeFocused();
  await page.getByLabel('Nom du tableau').fill('Travail');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByRole('heading', { name: 'Travail' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Travail' })).toBeVisible();

  const actions = page.getByRole('button', { name: 'Actions de Travail' });
  await actions.click();
  await page.getByRole('button', { name: 'Supprimer Travail' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Travail' })).toBeVisible();
  await expect(actions).toBeFocused();

  await actions.click();
  await page.getByRole('button', { name: 'Supprimer Travail' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
  await expect(page.getByText('Aucun tableau pour l')).toBeVisible();
});

test('une session expirée ramène à la connexion, puis aux tableaux', async ({ page, context }) => {
  const email = `${randomUUID()}@example.com`;
  await register(page, email);
  await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
  await context.clearCookies();
  await page.getByLabel('Nouveau tableau').fill('Perdu');
  await page.getByRole('button', { name: 'Créer le tableau' }).click();
  await expect(page).toHaveURL('/login');

  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
});

test('une liste indisponible propose de réessayer', async ({ page }) => {
  await page.route('**/api/boards', (route) => route.abort());
  await register(page, `${randomUUID()}@example.com`);
  await expect(page.getByText('Le serveur ne répond pas')).toBeVisible();
  await page.unroute('**/api/boards');
  await page.getByRole('button', { name: 'Réessayer' }).click();
  await expect(page.getByText('Aucun tableau pour l')).toBeVisible();
});
