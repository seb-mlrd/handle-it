import { randomUUID } from 'node:crypto';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { register } from './register';

const MOVE_STEPS = 12;

async function post(page: Page, path: string, data: unknown): Promise<string> {
  const origin = new URL(page.url()).origin;
  const response = await page.request.post(`/api${path}`, { data, headers: { origin } });
  return ((await response.json()) as { id: string }).id;
}

async function readOrder(page: Page): Promise<string[]> {
  const columns = page.getByRole('list', { name: 'Colonnes' }).locator(':scope > li:has(h2)');
  return columns.evaluateAll((elements) =>
    elements.map((element) => {
      const texts = [...element.querySelectorAll('h2, ul a')].map((node) => node.textContent);
      return texts.join(' ');
    }),
  );
}

const expectOrder = (page: Page, order: string[]) =>
  expect.poll(() => readOrder(page)).toEqual(order);

async function drag(page: Page, source: Locator, target: Locator, ratio = 0.5) {
  // hover attend que l'élément soit immobile : les cartes glissent encore après un dépôt.
  await source.hover();
  const to = await target.boundingBox();
  if (!to) throw new Error('Cible invisible');
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height * ratio, { steps: MOVE_STEPS });
  await page.mouse.move(to.x + to.width / 2 + 1, to.y + to.height * ratio);
  await page.mouse.up();
}

/** Recharge une fois que l'API a accepté tous les déplacements attendus. */
async function reloadAfterSaves(page: Page, savedStatuses: readonly number[], count: number) {
  await expect.poll(() => savedStatuses).toEqual(Array.from({ length: count }, () => 204));
  await page.reload();
}

function recordSaves(page: Page): number[] {
  const statuses: number[] = [];
  page.on('response', (response) => {
    if (response.url().endsWith('/position')) statuses.push(response.status());
  });
  return statuses;
}

const getCard = (page: Page, title: string) => page.getByRole('link', { name: title, exact: true });
const getColumn = (page: Page, name: string) =>
  page.getByRole('listitem').filter({ has: page.getByRole('heading', { name, exact: true }) });

test.beforeEach(async ({ page }) => {
  await register(page, `${randomUUID()}@example.com`);
  await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
  const boardId = await post(page, '/boards', { name: 'Test' });
  for (const [name, titles] of [
    ['A', ['un', 'deux', 'trois']],
    ['B', ['quatre']],
    ['C', []],
  ] as const) {
    const columnId = await post(page, `/boards/${boardId}/columns`, { name });
    for (const title of titles) {
      await post(page, `/boards/${boardId}/columns/${columnId}/cards`, { title });
    }
  }
  await page.goto(`/boards/${boardId}`);
  await expectOrder(page, ['A un deux trois', 'B quatre', 'C']);
});

test('à la souris : dans une colonne, entre colonnes, vers une vide, puis rechargement', async ({
  page,
}) => {
  const saves = recordSaves(page);
  await drag(page, getCard(page, 'un'), getCard(page, 'trois'));
  await expectOrder(page, ['A deux trois un', 'B quatre', 'C']);
  await drag(page, getCard(page, 'deux'), getCard(page, 'quatre'), 0.2);
  await expectOrder(page, ['A trois un', 'B deux quatre', 'C']);
  await drag(page, getCard(page, 'quatre'), getColumn(page, 'C'));
  await expectOrder(page, ['A trois un', 'B deux', 'C quatre']);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await reloadAfterSaves(page, saves, 3);
  await expectOrder(page, ['A trois un', 'B deux', 'C quatre']);
});

test('les colonnes se réordonnent et l’ordre persiste', async ({ page }) => {
  const saves = recordSaves(page);
  const handle = page.getByRole('button', { name: 'Déplacer la colonne C' });
  await drag(page, handle, getColumn(page, 'A'));
  await expectOrder(page, ['C', 'A un deux trois', 'B quatre']);
  await reloadAfterSaves(page, saves, 1);
  await expectOrder(page, ['C', 'A un deux trois', 'B quatre']);
});

test('au clavier : cartes et colonnes, annonces et annulation', async ({ page }) => {
  const press = async (...keys: string[]) => {
    for (const key of keys) {
      await page.keyboard.press(key);
      await page.waitForTimeout(150);
    }
  };
  await getCard(page, 'un').focus();
  await press('Space', 'ArrowDown', 'Space');
  await expectOrder(page, ['A deux un trois', 'B quatre', 'C']);
  await expect(getCard(page, 'un')).toBeFocused();

  await press('Space', 'ArrowRight', 'ArrowRight');
  await expect(page.getByRole('status').filter({ hasText: 'dans la colonne C' })).toHaveCount(1);
  await press('Space');
  await expectOrder(page, ['A deux trois', 'B quatre', 'C un']);

  await getCard(page, 'deux').focus();
  await press('Space', 'ArrowRight', 'Escape');
  await expectOrder(page, ['A deux trois', 'B quatre', 'C un']);

  await page.getByRole('button', { name: 'Déplacer la colonne A' }).focus();
  await press('Space', 'ArrowRight', 'Space');
  await expectOrder(page, ['B quatre', 'A deux trois', 'C un']);

  await getCard(page, 'quatre').focus();
  await press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('un échec remet la carte à sa place et le signale', async ({ page }) => {
  await page.route('**/position', (route) => route.abort());
  await drag(page, getCard(page, 'un'), getColumn(page, 'C'));
  await expect(page.getByRole('alert').filter({ hasText: 'Déplacement annulé' })).toBeVisible();
  await expectOrder(page, ['A un deux trois', 'B quatre', 'C']);
  await page.unroute('**/position');
  await drag(page, getCard(page, 'un'), getColumn(page, 'C'));
  await expectOrder(page, ['A deux trois', 'B quatre', 'C un']);
  await expect(page.getByText('Déplacement annulé')).toHaveCount(0);
});

test('l’écran est à jour avant la réponse du serveur', async ({ page }) => {
  const saves = recordSaves(page);
  let release = () => {};
  const isReleased = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/position', async (route) => {
    await isReleased;
    await route.continue();
  });
  await drag(page, getCard(page, 'un'), getColumn(page, 'C'));
  await expectOrder(page, ['A deux trois', 'B quatre', 'C un']);
  await drag(page, getCard(page, 'deux'), getColumn(page, 'C'), 0.95);
  await expectOrder(page, ['A trois', 'B quatre', 'C un deux']);
  release();
  await reloadAfterSaves(page, saves, 2);
  await expectOrder(page, ['A trois', 'B quatre', 'C un deux']);
});

test.describe('au toucher', () => {
  test.use({ hasTouch: true });

  async function touch(page: Page, source: Locator, target: Locator, holdMilliseconds: number) {
    const from = await source.boundingBox();
    const to = await target.boundingBox();
    if (!from || !to) throw new Error('Élément invisible');
    const client = await page.context().newCDPSession(page);
    const send = (type: 'touchStart' | 'touchMove' | 'touchEnd', x?: number, y?: number) => {
      const touchPoints = x === undefined || y === undefined ? [] : [{ x, y }];
      return client.send('Input.dispatchTouchEvent', { type, touchPoints });
    };
    const startX = from.x + from.width / 2;
    const startY = from.y + from.height / 2;
    await send('touchStart', startX, startY);
    await page.waitForTimeout(holdMilliseconds);
    for (let step = 1; step <= MOVE_STEPS; step += 1) {
      const progress = step / MOVE_STEPS;
      const x = startX + (to.x + to.width / 2 - startX) * progress;
      await send('touchMove', x, startY + (to.y + to.height / 2 - startY) * progress);
      await page.waitForTimeout(20);
    }
    await send('touchEnd');
  }

  test('un appui prolongé déplace, un glissement rapide ne déplace rien', async ({ page }) => {
    await touch(page, getCard(page, 'un'), getColumn(page, 'B'), 0);
    await expectOrder(page, ['A un deux trois', 'B quatre', 'C']);
    await touch(page, getCard(page, 'un'), getColumn(page, 'C'), 400);
    await expectOrder(page, ['A deux trois', 'B quatre', 'C un']);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('animations réduites', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('la carte déposée est en place sans glisser', async ({ page }) => {
    await drag(page, getCard(page, 'un'), getColumn(page, 'C'));
    await expectOrder(page, ['A deux trois', 'B quatre', 'C un']);
    const animationCount = await page.evaluate(
      () => document.getAnimations().filter(({ playState }) => playState === 'running').length,
    );
    expect(animationCount).toBe(0);
  });
});
