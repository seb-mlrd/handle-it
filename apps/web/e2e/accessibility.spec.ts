import { randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { post } from './board-helpers';
import { expectCleanPage } from './page-audit';
import { register } from './register';

const WIDTHS = [320, 768, 1280] as const;

interface Screen {
  readonly name: string;
  readonly path: string;
  readonly ready: (page: Page) => Promise<void>;
}

async function createContent(page: Page) {
  const boardId = await post(page, '/boards', {
    name: 'Un nom de tableau assez long pour passer à la ligne',
  });
  const columnId = await post(page, `/boards/${boardId}/columns`, { name: 'À faire' });
  await post(page, `/boards/${boardId}/columns`, { name: 'Fait' });
  const cardId = await post(page, `/boards/${boardId}/columns/${columnId}/cards`, {
    title: 'Une carte au titre plutôt long, pour vérifier son retour à la ligne',
  });
  const origin = new URL(page.url()).origin;
  for (const color of ['gray', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'pink']) {
    const label = await post(page, `/boards/${boardId}/labels`, { name: `Label ${color}`, color });
    await page.request.put(`/api/boards/${boardId}/cards/${cardId}/labels/${label}`, {
      headers: { origin },
    });
  }
  const response = await page.request.post(`/api/boards/${boardId}/invitations`, {
    data: { duration: 'one-day' },
    headers: { origin },
  });
  const { token } = (await response.json()) as { token: string };
  return { boardId, cardId, token };
}

const heading = (name: string | RegExp) => async (page: Page) => {
  await expect(page.getByRole('heading', { name }).first()).toBeVisible();
};

for (const colorScheme of ['light', 'dark'] as const) {
  test(`chaque écran est accessible et tient de 320 à 1280 px (${colorScheme})`, async ({
    page,
    browser,
  }) => {
    test.slow();
    await page.emulateMedia({ colorScheme });
    for (const path of ['/login', '/register']) {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);
        await page.getByRole('button', { name: /^(Se connecter|Créer un compte)$/ }).click();
        await expectCleanPage(page, `${path} avec erreurs à ${width}`);
      }
    }

    await register(page, `${randomUUID()}@example.com`);
    await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
    const { boardId, cardId, token } = await createContent(page);
    const screens: Screen[] = [
      { name: 'tableaux', path: '/', ready: heading('Mes tableaux') },
      { name: 'board', path: `/boards/${boardId}`, ready: heading('À faire') },
      {
        name: 'carte',
        path: `/boards/${boardId}/cards/${cardId}`,
        ready: heading('Détail de la carte'),
      },
      { name: 'membres', path: `/boards/${boardId}/members`, ready: heading('Membres') },
      { name: 'activité', path: `/boards/${boardId}/activity`, ready: heading('Activité') },
      { name: 'labels', path: `/boards/${boardId}/labels`, ready: heading('Labels') },
      {
        name: 'board introuvable',
        path: `/boards/${randomUUID()}`,
        ready: async (current) => {
          await expect(current.getByText("Ce tableau n'existe pas")).toBeVisible();
        },
      },
    ];
    for (const screen of screens) {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(screen.path);
        await screen.ready(page);
        await expectCleanPage(page, `${screen.name} à ${width}`);
      }
    }

    const guestContext = await browser.newContext({ locale: 'fr-FR', colorScheme });
    const guest = await guestContext.newPage();
    await register(guest, `${randomUUID()}@example.com`, 'Bob');
    await expect(guest.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
    for (const [name, hash] of [
      ['invitation', `#token=${token}`],
      ['invitation non valable', '#token=faux'],
    ]) {
      for (const width of WIDTHS) {
        await guest.setViewportSize({ width, height: 800 });
        await guest.goto('/');
        await guest.goto(`/invitation${hash}`);
        await heading(/Rejoindre|Invitation non valable/)(guest);
        await expectCleanPage(guest, `${name} à ${width}`);
      }
    }
    await guestContext.close();
  });
}

test('le premier Tab mène au lien d’évitement, qui saute l’en-tête', async ({ page }) => {
  await register(page, `${randomUUID()}@example.com`);
  await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
  // Après l'inscription, le focus reste sur le bouton du formulaire : on part d'une page neuve.
  await page.reload();
  await expect(page.getByLabel('Nouveau tableau')).toBeVisible();
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Aller au contenu' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Nouveau tableau')).toBeFocused();
});

test('la vitrine est accessible, tient de 320 à 1280 px et charge sans erreur', async ({
  page,
}) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/decouvrir');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectCleanPage(page, `vitrine à ${width} (${colorScheme})`);
    }
  }
  expect(failures).toEqual([]);
});
