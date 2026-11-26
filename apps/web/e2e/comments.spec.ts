import { randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { post } from './board-helpers';
import { register } from './register';

const getThread = (page: Page) => page.getByRole('list', { name: 'Commentaires' });
const getComment = (page: Page, author: string) =>
  page.getByRole('article', { name: `Commentaire de ${author}` });

test('deux membres échangent sur une carte en direct, chacun selon ses droits', async ({
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

  const cardPath = `/boards/${boardId}/cards/${cardId}`;
  await page.goto(cardPath);
  await guest.goto(cardPath);
  await expect(guest.getByText('En direct')).toBeVisible();
  await expect(guest.getByText("Aucun commentaire pour l'instant.")).toBeVisible();

  // Ctrl+Entrée envoie ; le brouillon de Bob survit à l'arrivée du message.
  await guest.getByLabel('Nouveau commentaire').fill('Je commence à écrire');
  await page.getByLabel('Nouveau commentaire').fill('Qui en achète ?');
  await page.getByLabel('Nouveau commentaire').press('Control+Enter');
  await expect(page.getByLabel('Nouveau commentaire')).toHaveValue('');
  await expect(getComment(guest, 'Ada')).toContainText('Qui en achète ?');
  await expect(guest.getByLabel('Nouveau commentaire')).toHaveValue('Je commence à écrire');
  await guest.getByLabel('Nouveau commentaire').fill('Moi, ce soir');
  await guest.getByRole('button', { name: 'Envoyer' }).click();
  await expect(getComment(page, 'Bob')).toContainText('Moi, ce soir');

  // Bob ne touche pas au message d'Ada ; Ada peut supprimer celui de Bob, pas le modifier.
  await expect(getComment(guest, 'Ada').getByRole('button')).toHaveCount(0);
  await expect(getComment(page, 'Bob').getByRole('button', { name: /^Modifier/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Supprimer le commentaire de Bob' })).toBeVisible();

  await page.getByRole('button', { name: 'Modifier le commentaire de Ada' }).click();
  await page.getByLabel('Modifier le commentaire').fill('Qui en achète deux ?');
  await page.getByRole('button', { name: 'Enregistrer le commentaire' }).click();
  await expect(getComment(guest, 'Ada')).toContainText('Qui en achète deux ?');
  await expect(getComment(guest, 'Ada')).toContainText('(modifié)');

  await guest.getByRole('button', { name: 'Fermer' }).click();
  const guestCard = guest.getByRole('link', { name: /^Pain/ });
  await expect(guestCard).toContainText('2 commentaires');
  await page.getByRole('button', { name: 'Supprimer le commentaire de Bob' }).click();
  await page
    .getByRole('dialog', { name: 'Supprimer le commentaire de Bob ?' })
    .getByRole('button', { name: 'Supprimer' })
    .click();
  await expect(getThread(page).getByRole('article')).toHaveCount(1);
  await expect(guestCard).toContainText('1 commentaire');
  await guest.context().close();
});
