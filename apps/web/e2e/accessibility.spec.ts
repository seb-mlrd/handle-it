import { randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { post } from './board-helpers';
import { expectCleanPage } from './page-audit';
import { register } from './register';

const WIDTHS = [320, 768, 1280] as const;
const ACCESSIBILITY_AUDIT_TIMEOUT_MILLISECONDS = 3 * 60_000;

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
  await page.request.put(`/api/boards/${boardId}/cards/${cardId}/due-date`, {
    data: { dueOn: '2020-01-01' },
    headers: { origin },
  });
  await post(page, `/boards/${boardId}/cards/${cardId}/comments`, {
    body: 'Un commentaire assez long pour passer à la ligne sur un petit écran, avec\nun retour.',
  });
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
    // Une dizaine d'écrans audités à trois largeurs : bien plus long qu'un parcours ordinaire,
    // surtout quand les autres parcours occupent la machine en parallèle.
    test.setTimeout(ACCESSIBILITY_AUDIT_TIMEOUT_MILLISECONDS);
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
        name: 'recherche',
        path: '/search?q=carte',
        ready: async (current) => {
          await expect(current.getByRole('list', { name: 'Résultats' })).toBeVisible();
        },
      },
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

// Le nom du lien d'une carte comprend son nombre de commentaires.
const getCard = (page: Page, title: string) =>
  page.getByRole('link', { name: new RegExp(`^${title}`) });

/** Board d'une colonne, d'une carte commentée et d'un label, ouvert à l'écran. */
async function openBoardWithCard(page: Page) {
  await register(page, `${randomUUID()}@example.com`);
  await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
  const boardId = await post(page, '/boards', { name: 'Focus' });
  const columnId = await post(page, `/boards/${boardId}/columns`, { name: 'À faire' });
  const cardId = await post(page, `/boards/${boardId}/columns/${columnId}/cards`, {
    title: 'Pain',
  });
  await post(page, `/boards/${boardId}/cards/${cardId}/comments`, { body: 'Du complet.' });
  await post(page, `/boards/${boardId}/labels`, { name: 'Urgent', color: 'red' });
  await page.goto(`/boards/${boardId}`);
  await expect(getCard(page, 'Pain')).toBeVisible();
}

test('le focus revient au bouton qui a ouvert un formulaire ou une fenêtre', async ({ page }) => {
  await openBoardWithCard(page);
  const addCard = page.getByRole('button', { name: 'Ajouter une carte à À faire' });
  await addCard.click();
  await page.keyboard.press('Escape');
  await expect(addCard).toBeFocused();

  const rename = page.getByRole('button', { name: 'Renommer la colonne À faire' });
  await rename.click();
  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(rename).toBeFocused();

  const deleteColumn = page.getByRole('button', { name: 'Supprimer la colonne À faire' });
  await deleteColumn.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Annuler' }).click();
  await expect(deleteColumn).toBeFocused();

  await getCard(page, 'Pain').click();
  const dialog = page.getByRole('dialog');
  const editComment = dialog.getByRole('button', { name: /^Modifier le commentaire/ });
  await editComment.click();
  await expect(dialog.getByLabel('Modifier le commentaire')).toBeFocused();
  await dialog.getByRole('button', { name: 'Annuler' }).click();
  await expect(editComment).toBeFocused();
  await dialog.getByRole('button', { name: 'Fermer', exact: true }).click();
  await expect(getCard(page, 'Pain')).toBeFocused();
});

test('le menu des labels se ferme par Échap ou par un clic ailleurs', async ({ page }) => {
  await openBoardWithCard(page);
  const menu = page.locator('details');
  const summary = page.getByText('Filtrer par label', { exact: true });
  await summary.click();
  await expect(page.getByRole('checkbox', { name: 'Urgent' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveAttribute('open');
  await expect(summary).toBeFocused();

  await summary.click();
  await page.getByRole('heading', { name: 'Focus' }).click();
  await expect(menu).not.toHaveAttribute('open');
});

test('un board s’affiche sans erreur dans la console', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await openBoardWithCard(page);
  await page.getByRole('link', { name: 'Labels' }).click();
  await expect(page.getByRole('heading', { name: 'Labels' })).toBeVisible();
  // L'inscription vérifie d'abord la session, absente : sa réponse 401 est attendue.
  expect(errors.filter((error) => !error.includes('401'))).toEqual([]);
});
