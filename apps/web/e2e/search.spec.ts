import { randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { drag, expectOrder, post } from './board-helpers';
import { register } from './register';

async function createBoard(page: Page, name: string, titles: string[]) {
  const boardId = await post(page, '/boards', { name });
  const columnId = await post(page, `/boards/${boardId}/columns`, { name: 'À faire' });
  const cardIds: string[] = [];
  for (const title of titles) {
    cardIds.push(await post(page, `/boards/${boardId}/columns/${columnId}/cards`, { title }));
  }
  return { boardId, cardIds };
}

test('« pates » trouve « Pâtes », jamais dans le board d’un autre, et ouvre la carte', async ({
  page,
  browser,
}) => {
  const stranger = await (await browser.newContext({ locale: 'fr-FR' })).newPage();
  await register(stranger, `${randomUUID()}@example.com`, 'Eve');
  await expect(stranger.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
  await createBoard(stranger, 'Chez Eve', ['Pâtes d’Eve']);
  await stranger.context().close();

  await register(page, `${randomUUID()}@example.com`);
  await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
  await createBoard(page, 'Maison', ['Acheter des Pâtes fraîches', 'Lait']);
  await page.reload();
  await page.keyboard.press('/');
  await expect(page.getByRole('searchbox', { name: 'Rechercher une carte' })).toBeFocused();
  await page.keyboard.type('pates');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/search\?q=pates/);
  const results = page.getByRole('list', { name: 'Résultats' }).getByRole('link');
  await expect(page.getByRole('status')).toHaveText('1 carte trouvée.');
  await expect(results).toHaveCount(1);
  await expect(results.first().locator('mark')).toHaveText('Pâtes');
  await expect(results.first()).toContainText('Maison · À faire');

  // La recherche suit la frappe, après une pause : une seule requête pour le mot entier.
  const searches: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/api/search') searches.push(url.searchParams.get('q') ?? '');
  });
  const field = page.getByRole('searchbox', { name: 'Rechercher une carte' });
  await field.clear();
  await field.pressSequentially('lait', { delay: 50 });
  await expect(page).toHaveURL(/\/search\?q=lait/);
  await expect(results.first()).toContainText('Lait');
  expect(searches).toEqual(['lait']);
  await results.first().click();
  await expect(page.getByRole('heading', { name: 'Détail de la carte' })).toBeVisible();
  await expect(page.getByLabel('Titre')).toHaveValue('Lait');
});

test('le filtre du board masque des cartes, et le glisser-déposer reste juste', async ({
  page,
}) => {
  await register(page, `${randomUUID()}@example.com`);
  await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
  const { boardId, cardIds } = await createBoard(page, 'Maison', [
    'Pain',
    'Lait',
    'Beurre',
    'Œufs',
  ]);
  const urgent = await post(page, `/boards/${boardId}/labels`, { name: 'Urgent', color: 'red' });
  const origin = new URL(page.url()).origin;
  for (const cardId of [cardIds[0], cardIds[2]]) {
    await page.request.put(`/api/boards/${boardId}/cards/${cardId}/labels/${urgent}`, {
      headers: { origin },
    });
  }
  await page.goto(`/boards/${boardId}`);
  await expect(page.getByText('En direct')).toBeVisible();

  await page.getByLabel('Filtrer les cartes').fill('lait');
  await expect(page.getByRole('status').filter({ hasText: 'Cartes affichées' })).toHaveText(
    'Cartes affichées : 1 sur 4',
  );
  await expectOrder(page, ['À faire Lait']);
  await page.getByLabel('Filtrer les cartes').fill('');

  await page.getByText('Filtrer par label', { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Urgent' }).check();
  await page.getByText('Filtrer par label (1)', { exact: true }).click();
  // Le texte d'une carte comprend celui de ses labels.
  await expectOrder(page, ['À faire PainUrgent BeurreUrgent']);
  const getCard = (title: string) => page.getByRole('link', { name: new RegExp(`^${title}`) });
  await drag(page, getCard('Beurre'), getCard('Pain'), 0.2);
  await expectOrder(page, ['À faire BeurreUrgent PainUrgent']);
  await page.getByRole('button', { name: 'Effacer les filtres' }).click();
  await expectOrder(page, ['À faire BeurreUrgent PainUrgent Lait Œufs']);
  await page.reload();
  await expectOrder(page, ['À faire BeurreUrgent PainUrgent Lait Œufs']);
});
