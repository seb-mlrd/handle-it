import { expect, type Locator, type Page } from '@playwright/test';

export const MOVE_STEPS = 12;

export async function post(page: Page, path: string, data: unknown): Promise<string> {
  const origin = new URL(page.url()).origin;
  const response = await page.request.post(`/api${path}`, { data, headers: { origin } });
  return ((await response.json()) as { id: string }).id;
}

export async function readOrder(page: Page): Promise<string[]> {
  const columns = page.getByRole('list', { name: 'Colonnes' }).locator(':scope > li:has(h2)');
  return columns.evaluateAll((elements) =>
    elements.map((element) => {
      const texts = [...element.querySelectorAll('h2, ul a')].map((node) => node.textContent);
      return texts.join(' ');
    }),
  );
}

export const expectOrder = (page: Page, order: string[]) =>
  expect.poll(() => readOrder(page)).toEqual(order);

/** La copie qui suit le pointeur, puis se pose (drag-preview.tsx). */
const DROP_PREVIEW = '.cursor-grabbing';

/** Glisse puis dépose ; renvoie l'heure du lâcher, pour mesurer ce qui suit. */
export async function drag(
  page: Page,
  source: Locator,
  target: Locator,
  ratio = 0.5,
): Promise<number> {
  // hover attend que l'élément soit immobile : les cartes glissent encore après un dépôt.
  await source.hover();
  const to = await target.boundingBox();
  if (!to) throw new Error('Cible invisible');
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height * ratio, { steps: MOVE_STEPS });
  await page.mouse.move(to.x + to.width / 2 + 1, to.y + to.height * ratio);
  await page.mouse.up();
  const droppedAt = Date.now();
  // dnd-kit ignore tout nouveau geste tant que la copie déposée finit de se poser (environ 0,2 s).
  await expect(page.locator(DROP_PREVIEW)).toHaveCount(0);
  return droppedAt;
}

export const getCard = (page: Page, title: string) =>
  page.getByRole('link', { name: title, exact: true });
export const getColumn = (page: Page, name: string) =>
  page.getByRole('listitem').filter({ has: page.getByRole('heading', { name, exact: true }) });
