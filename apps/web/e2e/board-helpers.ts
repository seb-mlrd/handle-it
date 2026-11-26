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

export async function drag(page: Page, source: Locator, target: Locator, ratio = 0.5) {
  // hover attend que l'élément soit immobile : les cartes glissent encore après un dépôt.
  await source.hover();
  const to = await target.boundingBox();
  if (!to) throw new Error('Cible invisible');
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height * ratio, { steps: MOVE_STEPS });
  await page.mouse.move(to.x + to.width / 2 + 1, to.y + to.height * ratio);
  await page.mouse.up();
}

export const getCard = (page: Page, title: string) =>
  page.getByRole('link', { name: title, exact: true });
export const getColumn = (page: Page, name: string) =>
  page.getByRole('listitem').filter({ has: page.getByRole('heading', { name, exact: true }) });
