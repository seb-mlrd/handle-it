import { randomUUID } from 'node:crypto';
import { type Browser, expect, type Page, test } from '@playwright/test';
import { fillRegistration, PASSWORD, register } from './register';

const createEmail = () => `${randomUUID()}@example.com`;

async function openGuestPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ locale: 'fr-FR' });
  return context.newPage();
}

async function createInvitation(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'Créer un lien' }).click();
  return page.getByLabel("Lien d'invitation").inputValue();
}

const readMembers = (page: Page) => page.getByRole('list', { name: 'Membres du tableau' });

test.beforeEach(async ({ page }) => {
  await register(page, createEmail());
  await page.getByLabel('Nouveau tableau').fill('Maison');
  await page.keyboard.press('Enter');
  await page.getByRole('link', { name: 'Maison' }).click();
  await page.getByRole('link', { name: 'Membres' }).click();
  await expect(readMembers(page)).toContainText('Ada (toi)');
});

test('inviter, s’inscrire, rejoindre, puis retirer', async ({
  page,
  browser,
  context,
  baseURL,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL ?? '' });
  const link = await createInvitation(page);
  await page.getByRole('button', { name: 'Copier le lien' }).click();
  await expect(page.getByText('Lien copié.')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link);

  const guest = await openGuestPage(browser);
  await guest.goto(link);
  await expect(guest).toHaveURL('/login');
  await guest.getByRole('link', { name: 'Créer un compte' }).click();
  await fillRegistration(guest, createEmail(), 'Bob');
  await expect(guest.getByRole('heading', { name: 'Rejoindre « Maison »' })).toBeVisible();
  await guest.getByRole('button', { name: 'Rejoindre le tableau' }).click();
  await expect(guest.getByRole('heading', { name: 'Maison' })).toBeVisible();

  await guest.getByRole('button', { name: 'Ajouter une colonne' }).click();
  await guest.getByLabel('Nouvelle colonne').fill('De Bob');
  await guest.keyboard.press('Enter');
  await expect(guest.getByRole('heading', { name: 'De Bob' })).toBeVisible();

  await guest.getByRole('link', { name: 'Membres' }).click();
  await expect(readMembers(guest)).toContainText('Bob (toi)');
  await expect(guest.getByRole('button', { name: 'Créer un lien' })).toHaveCount(0);
  await expect(guest.getByRole('button', { name: /^Retirer/ })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('list', { name: 'Liens en cours' })).toHaveCount(0);
  const spareLink = await createInvitation(page);
  await page.getByRole('button', { name: 'Retirer Bob' }).click();
  await page.getByRole('button', { name: 'Retirer', exact: true }).click();
  await expect(readMembers(page)).not.toContainText('Bob');
  await expect(page.getByRole('list', { name: 'Liens en cours' })).toHaveCount(0);

  await guest.reload();
  await expect(guest.getByText("Ce tableau n'existe pas, ou tu n'y as pas accès.")).toBeVisible();
  for (const address of [link, spareLink]) {
    await guest.goto('/');
    await guest.goto(address);
    await expect(guest.getByRole('heading', { name: 'Invitation non valable' })).toBeVisible();
  }
});

test('se connecter ramène à l’invitation, puis le membre quitte le tableau', async ({
  page,
  browser,
}) => {
  const link = await createInvitation(page);
  const guest = await openGuestPage(browser);
  const email = createEmail();
  await register(guest, email, 'Bob');
  await guest.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(guest).toHaveURL('/login');

  await guest.goto(link);
  await guest.getByLabel('E-mail').fill(email);
  await guest.getByLabel('Mot de passe', { exact: true }).fill(PASSWORD);
  await guest.getByRole('button', { name: 'Se connecter' }).click();
  await guest.getByRole('button', { name: 'Rejoindre le tableau' }).click();

  await guest.getByRole('link', { name: 'Membres' }).click();
  await guest.getByRole('button', { name: 'Quitter le tableau' }).click();
  await guest.getByRole('button', { name: 'Quitter', exact: true }).click();
  await expect(guest).toHaveURL('/');
  await expect(guest.getByText('Aucun tableau pour l')).toBeVisible();
});

test('la durée se choisit, et un lien tronqué ou sans jeton est refusé', async ({
  page,
  browser,
}) => {
  // Le minuteur de la page doit naître sous l’horloge simulée.
  await page.clock.install();
  await page.reload();
  await page.getByLabel('Durée de validité').selectOption('1 heure');
  const link = await createInvitation(page);
  const links = page.getByRole('list', { name: 'Liens en cours' });
  await expect(links).toHaveText(/Lien actif encore (1\sheure|60\sminutes)$/);
  await page.getByLabel('Durée de validité').selectOption('7 jours');
  await page.getByRole('button', { name: 'Créer un lien' }).click();
  await expect(links.getByRole('listitem').last()).toHaveText('Lien actif encore 7 jours');
  await page.clock.fastForward('01:01:00');
  await expect(links.getByRole('listitem')).toHaveCount(1);

  const guest = await openGuestPage(browser);
  await register(guest, createEmail(), 'Bob');
  await expect(guest).toHaveURL('/');
  for (const address of [link.slice(0, -5), '/invitation']) {
    await guest.goto('/');
    await guest.goto(address);
    await expect(guest.getByRole('heading', { name: 'Invitation non valable' })).toBeVisible();
  }
});
