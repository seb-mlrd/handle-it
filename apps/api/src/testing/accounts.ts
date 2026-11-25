import type { TestServer } from './test-server.js';

const createEmail = (name: string) => `${name}@example.com`;

/** Crée un compte et renvoie son cookie de session. */
export async function registerUser(server: TestServer, name: string): Promise<string> {
  const body = { email: createEmail(name), displayName: name, password: 'mot-de-passe-long' };
  const response = await server.send('POST', '/auth/register', { body });
  return response.headers.get('set-cookie')?.split(';')[0] ?? '';
}

/** Ajoute un membre directement en base, tant que les invitations n'existent pas. */
export async function addMember(server: TestServer, boardId: string, name: string): Promise<void> {
  const database = server.getDatabase();
  const { id: userId } = await database.user.findUniqueOrThrow({
    where: { email: createEmail(name) },
    select: { id: true },
  });
  await database.membership.create({ data: { boardId, userId, role: 'member' } });
}
