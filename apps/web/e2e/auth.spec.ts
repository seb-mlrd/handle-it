import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { PASSWORD, register } from './register';

test('inscription, session conservée, déconnexion puis connexion', async ({ page, context }) => {
  const email = `${randomUUID()}@example.com`;
  await register(page, email);
  await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();

  const [cookie] = await context.cookies();
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page).toHaveURL('/login');

  // Le jeton volé avant la déconnexion ne doit plus servir.
  await context.addCookies(cookie ? [cookie] : []);
  expect((await context.request.get('/api/auth/me')).status()).toBe(401);
  await context.clearCookies();

  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
});

test('sans session, une page protégée ramène à la connexion', async ({ page }) => {
  await page.goto('/boards/00000000-0000-4000-8000-000000000000');
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('heading', { name: 'Se connecter' })).toBeVisible();
});

test('connecté, les pages de visiteur ramènent à l’accueil', async ({ page }) => {
  await register(page, `${randomUUID()}@example.com`);
  await expect(page).toHaveURL('/');
  await page.goto('/login');
  await expect(page).toHaveURL('/');
});

test('les erreurs s’affichent sous leur champ et le premier reçoit le focus', async ({ page }) => {
  await page.goto('/register');
  await page.getByRole('button', { name: 'Créer un compte' }).click();
  await expect(page.getByText('Le nom est obligatoire')).toBeVisible();
  await expect(page.getByText("L'adresse e-mail est invalide")).toBeVisible();
  await expect(page.getByLabel('Nom', { exact: true })).toBeFocused();
  await expect(page.getByLabel('Mot de passe', { exact: true })).toHaveAccessibleDescription(
    /12 caractères minimum.*au moins 12 caractères/,
  );
});

test('une adresse déjà utilisée est signalée sous l’e-mail', async ({ page, context }) => {
  const email = `${randomUUID()}@example.com`;
  await register(page, email);
  await expect(page).toHaveURL('/');
  await context.clearCookies();
  await register(page, email);
  await expect(page.getByLabel('E-mail')).toHaveAccessibleDescription(
    'Cette adresse e-mail est déjà utilisée.',
  );
});

test('des identifiants faux affichent une alerte', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('inconnu@example.com');
  await page.getByLabel('Mot de passe', { exact: true }).fill('faux');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('alert')).toHaveText('E-mail ou mot de passe incorrect.');
});

test('un serveur injoignable propose de réessayer', async ({ page }) => {
  await page.route('**/api/auth/me', (route) => route.abort());
  await page.goto('/boards/00000000-0000-4000-8000-000000000000');
  await expect(page.getByRole('alert')).toContainText('Le serveur ne répond pas');
  await page.unroute('**/api/auth/me');
  await page.getByRole('button', { name: 'Réessayer' }).click();
  await expect(page).toHaveURL('/login');
});

test('une confirmation différente bloque l’inscription', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Mot de passe', { exact: true }).fill(PASSWORD);
  const confirmation = page.getByLabel('Confirmer le mot de passe', { exact: true });
  await confirmation.fill('autre');
  await page.getByRole('button', { name: 'Créer un compte' }).click();
  await expect(confirmation).toHaveAccessibleDescription('Les mots de passe ne correspondent pas');
  await expect(page).toHaveURL('/register');
});

test('l’œil affiche puis masque le mot de passe sans effacer la saisie', async ({ page }) => {
  await page.goto('/login');
  const password = page.getByLabel('Mot de passe', { exact: true });
  await password.fill(PASSWORD);
  await page.getByRole('button', { name: 'Afficher' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(password).toHaveValue(PASSWORD);
  await page.getByRole('button', { name: 'Masquer' }).click();
  await expect(password).toHaveAttribute('type', 'password');
  await expect(page).toHaveURL('/login');
});

test('un visiteur qui arrive sur l’accueil voit la vitrine, puis peut créer un compte', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL('/decouvrir');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Tableaux de tâches à plusieurs',
  );
  await page.getByRole('main').getByRole('link', { name: 'Créer un compte' }).click();
  await expect(page).toHaveURL('/register');
  await page.getByRole('link', { name: 'Handle It' }).click();
  await expect(page).toHaveURL('/decouvrir');
});
