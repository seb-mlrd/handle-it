import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { register } from './register';

test('un board complet survit au rechargement', async ({ page }) => {
  await register(page, `${randomUUID()}@example.com`);
  await page.getByLabel('Nouveau tableau').fill('Maison');
  await page.keyboard.press('Enter');
  await page.getByRole('link', { name: 'Maison' }).click();
  await expect(page.getByText('Ce tableau est vide')).toBeVisible();

  await page.getByRole('button', { name: 'Ajouter une colonne' }).click();
  for (const name of ['À faire', 'Fait']) {
    await page.getByLabel('Nouvelle colonne').fill(name);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name })).toBeVisible();
  }
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Ajouter une carte à À faire' }).click();
  for (const title of ['Pain', 'Lait']) {
    await page.getByLabel('Nouvelle carte').fill(title);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('link', { name: title })).toBeVisible();
  }
  // Saisie en rafale : rien ne doit se perdre ni se mélanger.
  for (const title of ['Œufs', 'Sel', 'Riz']) {
    await page.getByLabel('Nouvelle carte').fill(title);
    await page.keyboard.press('Enter');
  }
  await expect(page.getByRole('link', { name: 'Riz' })).toBeVisible();
  await page.reload();
  const cards = page.getByRole('list', { name: 'Cartes de À faire' }).getByRole('link');
  await expect(cards).toHaveText(['Pain', 'Lait', 'Œufs', 'Sel', 'Riz']);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(['À faire', 'Fait']);

  await page.getByRole('link', { name: 'Pain' }).click();
  await page.getByLabel('Titre').fill('Pain complet');
  await page.getByLabel('Description').fill('Deux\nbaguettes');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Fermer sans enregistrer' })).toBeVisible();
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('link', { name: 'Pain complet' }).click();
  await page.reload();
  await expect(page.getByLabel('Description')).toHaveValue('Deux\nbaguettes');

  await page.getByRole('button', { name: 'Supprimer la carte' }).click();
  await page.getByRole('button', { name: 'Supprimer', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(cards).toHaveText(['Lait', 'Œufs', 'Sel', 'Riz']);

  await page.getByRole('button', { name: 'Actions de la colonne Fait' }).click();
  await page.getByRole('button', { name: 'Renommer la colonne Fait' }).click();
  await page.getByLabel('Nom de la colonne').fill('Terminé');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Terminé' })).toBeVisible();
  await page.getByRole('button', { name: 'Actions de la colonne À faire' }).click();
  await page.getByRole('button', { name: 'Supprimer la colonne À faire' }).click();
  await page.getByRole('button', { name: 'Supprimer', exact: true }).click();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Terminé']);

  for (const id of [randomUUID(), 'mal-forme']) {
    await page.goto(`/boards/${id}`);
    await expect(page.getByRole('alert').filter({ hasText: 'pas accès' })).toBeVisible();
  }
});
