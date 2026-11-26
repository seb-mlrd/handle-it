import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { drag, getCard, getColumn, post } from './board-helpers';
import { register } from './register';

test('l’historique du board et d’une carte se remplit, en direct chez un autre membre', async ({
  page,
  browser,
}) => {
  await register(page, `${randomUUID()}@example.com`);
  await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
  const boardId = await post(page, '/boards', { name: 'Maison' });
  for (const name of ['À faire', 'Fait']) await post(page, `/boards/${boardId}/columns`, { name });
  const origin = new URL(page.url()).origin;
  const invitation = await page.request.post(`/api/boards/${boardId}/invitations`, {
    data: { duration: 'one-day' },
    headers: { origin },
  });
  const { token } = (await invitation.json()) as { token: string };

  const guest = await (await browser.newContext({ locale: 'fr-FR' })).newPage();
  await register(guest, `${randomUUID()}@example.com`, 'Bob');
  await expect(guest.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
  await post(guest, '/invitations/accept', { token });
  await guest.goto(`/boards/${boardId}/activity`);
  const guestHistory = guest.getByRole('list', { name: 'Activité' });
  await expect(guestHistory.getByRole('listitem').first()).toHaveText(/Bob a rejoint le tableau/);

  await page.goto(`/boards/${boardId}`);
  await page.getByRole('button', { name: 'Ajouter une carte à À faire' }).click();
  await page.getByLabel('Nouvelle carte').fill('Pain');
  await page.keyboard.press('Enter');
  await expect(getCard(page, 'Pain')).toBeVisible();
  await drag(page, getCard(page, 'Pain'), getColumn(page, 'Fait'));
  await expect(guestHistory.getByRole('listitem').first()).toHaveText(
    /Ada a déplacé la carte « Pain » vers « Fait »\s*à l'instant/,
  );

  await getCard(page, 'Pain').click();
  const cardHistory = page.getByRole('dialog').getByRole('list', { name: 'Activité' });
  await expect(cardHistory.getByRole('listitem')).toHaveText([
    /a déplacé la carte « Pain » vers « Fait »/,
    /a créé la carte « Pain » dans « À faire »/,
  ]);
  await guest.context().close();
});
