import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { post } from './board-helpers';
import { register } from './register';

test('une échéance se pose, se voit en direct, et passe en retard à minuit', async ({
  page,
  browser,
}) => {
  await register(page, `${randomUUID()}@example.com`);
  await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
  const boardId = await post(page, '/boards', { name: 'Maison' });
  const columnId = await post(page, `/boards/${boardId}/columns`, { name: 'À faire' });
  const cardId = await post(page, `/boards/${boardId}/columns/${columnId}/cards`, {
    title: 'Pain',
  });
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

  // La veille au soir, une heure avant minuit.
  await guest.clock.install({ time: new Date(2026, 10, 26, 23, 0) });
  await guest.goto(`/boards/${boardId}`);
  await expect(guest.getByText('En direct')).toBeVisible();

  await page.goto(`/boards/${boardId}/cards/${cardId}`);
  await page.getByLabel("Date d'échéance").fill('2026-11-26');
  await page.getByRole('button', { name: "Enregistrer l'échéance" }).click();
  await expect(page.getByText('Le 26 novembre 2026')).toBeVisible();

  const guestCard = guest.getByRole('link', { name: /^Pain/ });
  await expect(guestCard).toContainText("Aujourd'hui");
  await guest.clock.fastForward('01:30:00');
  await expect(guestCard).toContainText('En retard');

  await page.getByRole('button', { name: "Retirer l'échéance" }).click();
  await expect(page.getByText('Aucune échéance.')).toBeVisible();
  await expect(guestCard).not.toContainText('En retard');
  await guest.context().close();
});
