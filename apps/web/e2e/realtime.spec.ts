import { randomUUID } from 'node:crypto';
import { type Browser, expect, type Page, test, type WebSocketRoute } from '@playwright/test';
import { drag, expectOrder, getCard, getColumn, MOVE_STEPS, post } from './board-helpers';
import { register } from './register';

const MAX_DELAY_MILLISECONDS = 1000;

let boardId: string;
let guest: Page;

async function openGuest(browser: Browser, owner: Page): Promise<Page> {
  const { token } = await createInvitation(owner);
  const context = await browser.newContext({ locale: 'fr-FR' });
  const page = await context.newPage();
  await register(page, `${randomUUID()}@example.com`, 'Bob');
  await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
  await post(page, '/invitations/accept', { token });
  return page;
}

async function createInvitation(owner: Page): Promise<{ token: string }> {
  const origin = new URL(owner.url()).origin;
  const response = await owner.request.post(`/api/boards/${boardId}/invitations`, {
    data: { duration: 'one-day' },
    headers: { origin },
  });
  return (await response.json()) as { token: string };
}

/** Coupe réellement la connexion en direct, et refuse les suivantes jusqu'au rétablissement. */
async function controlRealtime(page: Page) {
  let isCut = false;
  let current: WebSocketRoute | null = null;
  await page.routeWebSocket(/\/api\/realtime/, async (socket) => {
    if (isCut) {
      await socket.close();
      return;
    }
    current = socket;
    socket.connectToServer();
  });
  return {
    cut: async () => {
      isCut = true;
      await page.context().setOffline(true);
      await current?.close();
    },
    restore: async () => {
      await page.context().setOffline(false);
      isCut = false;
    },
  };
}

const expectLive = (page: Page) => expect(page.getByText('En direct')).toBeVisible();

test.beforeEach(async ({ page, browser }) => {
  await register(page, `${randomUUID()}@example.com`);
  await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
  boardId = await post(page, '/boards', { name: 'Partagé' });
  for (const [name, titles] of [
    ['A', ['un', 'deux', 'trois']],
    ['B', ['quatre']],
  ] as const) {
    const columnId = await post(page, `/boards/${boardId}/columns`, { name });
    for (const title of titles) {
      await post(page, `/boards/${boardId}/columns/${columnId}/cards`, { title });
    }
  }
  guest = await openGuest(browser, page);
  for (const member of [page, guest]) {
    await member.goto(`/boards/${boardId}`);
    await expectLive(member);
  }
});

test.afterEach(() => guest.context().close());

test('un déplacement apparaît chez l’autre en moins d’une seconde', async ({ page }) => {
  const droppedAt = await drag(guest, getCard(guest, 'un'), getCard(guest, 'quatre'), 0.2);
  await expectOrder(page, ['A deux trois', 'B un quatre']);
  expect(Date.now() - droppedAt).toBeLessThan(MAX_DELAY_MILLISECONDS);
  await expectOrder(guest, ['A deux trois', 'B un quatre']);
});

test('colonnes et cartes créées, modifiées ou supprimées se voient en direct', async ({ page }) => {
  await page.getByRole('button', { name: 'Ajouter une colonne' }).click();
  await page.getByLabel('Nouvelle colonne').fill('C');
  await page.keyboard.press('Enter');
  await expectOrder(guest, ['A un deux trois', 'B quatre', 'C']);
  await expectOrder(page, ['A un deux trois', 'B quatre', 'C']);

  await guest.getByRole('button', { name: 'Ajouter une carte à C' }).click();
  await guest.getByLabel('Nouvelle carte').fill('cinq');
  await guest.keyboard.press('Enter');
  await expectOrder(page, ['A un deux trois', 'B quatre', 'C cinq']);

  await getCard(page, 'cinq').click();
  await page.getByLabel('Titre').fill('six');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expectOrder(guest, ['A un deux trois', 'B quatre', 'C six']);

  await getCard(guest, 'six').click();
  await expect(guest.getByLabel('Titre')).toHaveValue('six');
  await getCard(page, 'six').click();
  await page.getByRole('button', { name: 'Supprimer la carte' }).click();
  await page.getByRole('button', { name: 'Supprimer', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(guest.getByText('Cette carte a été supprimée.')).toBeVisible();
});

test('après une coupure, l’écran se resynchronise', async ({ page }) => {
  test.slow();
  const realtime = await controlRealtime(guest);
  await guest.reload();
  await expectLive(guest);
  await realtime.cut();
  await expect(guest.getByText('Hors ligne')).toBeVisible();
  await drag(page, getCard(page, 'un'), getColumn(page, 'B'), 0.95);
  await drag(page, getCard(page, 'trois'), getCard(page, 'deux'), 0.2);
  await expectOrder(page, ['A trois deux', 'B quatre un']);
  await expectOrder(guest, ['A un deux trois', 'B quatre']);
  // Assez long pour que des tentatives de reconnexion échouent.
  await guest.waitForTimeout(3000);
  await realtime.restore();
  await expect(guest.getByText('En direct')).toBeVisible({ timeout: 15_000 });
  await expectOrder(guest, ['A trois deux', 'B quatre un']);
});

test('les changements reçus pendant un geste sont conservés', async ({ page }) => {
  const target = await getColumn(guest, 'B').boundingBox();
  if (!target) throw new Error('Colonne invisible');
  await getCard(guest, 'un').hover();
  await guest.mouse.down();
  await guest.mouse.move(target.x + target.width / 2, target.y + target.height * 0.95, {
    steps: MOVE_STEPS,
  });

  await page.getByRole('button', { name: 'Ajouter une carte à A' }).click();
  await page.getByLabel('Nouvelle carte').fill('cinq');
  await page.keyboard.press('Enter');
  await expect(getCard(page, 'cinq')).toBeVisible();
  await getCard(page, 'quatre').click();
  await page.getByRole('button', { name: 'Supprimer la carte' }).click();
  await page.getByRole('button', { name: 'Supprimer', exact: true }).click();
  await expect(getCard(page, 'quatre')).toHaveCount(0);

  await guest.mouse.up();
  await expectOrder(guest, ['A deux trois cinq', 'B un']);
  await expectOrder(page, ['A deux trois cinq', 'B un']);
  await expect(guest.getByText('Déplacement annulé')).toHaveCount(0);
});

test('un membre retiré perd l’écran aussitôt', async ({ page }) => {
  await page.getByRole('link', { name: 'Membres' }).click();
  await page.getByRole('button', { name: 'Retirer Bob' }).click();
  await page.getByRole('button', { name: 'Retirer', exact: true }).click();
  await expect(guest.getByText("Ce tableau n'existe pas, ou tu n'y as pas accès.")).toBeVisible();
  await expect(getCard(guest, 'un')).toHaveCount(0);
});

test('une session fermée dans un autre onglet ramène à la connexion', async () => {
  const otherTab = await guest.context().newPage();
  await otherTab.goto('/');
  await otherTab.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(guest).toHaveURL('/login');
});
