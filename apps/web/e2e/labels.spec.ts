import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { getCard, post } from './board-helpers';
import { register } from './register';

test('créer des labels, les poser, et les voir en direct chez un autre membre', async ({
  page,
  browser,
}) => {
  await register(page, `${randomUUID()}@example.com`);
  await expect(page.getByRole('heading', { name: 'Mes tableaux' })).toBeVisible();
  const boardId = await post(page, '/boards', { name: 'Maison' });
  const columnId = await post(page, `/boards/${boardId}/columns`, { name: 'À faire' });
  await post(page, `/boards/${boardId}/columns/${columnId}/cards`, { title: 'Pain' });
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
  await guest.goto(`/boards/${boardId}`);
  await expect(guest.getByText('En direct')).toBeVisible();

  await page.goto(`/boards/${boardId}/labels`);
  await page.getByLabel('Nom du label').fill('Urgent');
  await page.getByLabel('Couleur').selectOption('Rouge');
  await page.getByRole('button', { name: 'Créer le label' }).click();
  await expect(page.getByLabel('Nom du label')).toHaveValue('');
  await page.getByLabel('Nom du label').fill('urgent');
  await page.getByRole('button', { name: 'Créer le label' }).click();
  await expect(page.getByLabel('Nom du label')).toHaveAccessibleDescription(
    'Un label porte déjà ce nom sur ce tableau.',
  );
  await page.getByLabel('Nom du label').fill('Calme');
  await page.getByLabel('Couleur').selectOption('Vert');
  await page.getByRole('button', { name: 'Créer le label' }).click();
  await expect(
    page.getByRole('list', { name: 'Labels du tableau' }).getByRole('listitem'),
  ).toHaveCount(2);
  await page.getByRole('button', { name: 'Fermer' }).click();

  await getCard(page, 'Pain').click();
  await page.getByRole('checkbox', { name: 'Urgent' }).check();
  await expect(page.getByRole('checkbox', { name: 'Urgent' })).toBeChecked();
  await page.getByRole('button', { name: 'Fermer' }).click();

  const guestCard = guest.getByRole('link', { name: /^Pain/ });
  await expect(guestCard.getByRole('list', { name: 'Labels' })).toHaveText('Urgent');
  await guestCard.click();
  await guest.getByRole('checkbox', { name: 'Calme' }).check();
  await guest.getByRole('checkbox', { name: 'Urgent' }).uncheck();
  await guest.getByRole('button', { name: 'Fermer' }).click();
  const ownerCard = page.getByRole('link', { name: /^Pain/ });
  await expect(ownerCard.getByRole('list', { name: 'Labels' })).toHaveText('Calme');

  await page.goto(`/boards/${boardId}/labels`);
  await page.getByRole('button', { name: 'Supprimer le label Calme' }).click();
  await page.getByRole('button', { name: 'Supprimer', exact: true }).click();
  await expect(guestCard.getByRole('list', { name: 'Labels' })).toHaveCount(0);
  await guest.context().close();
});
