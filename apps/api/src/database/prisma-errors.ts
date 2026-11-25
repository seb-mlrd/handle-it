import { Prisma } from '../generated/prisma/client.js';

const UNIQUE_CONSTRAINT_CODE = 'P2002';
const FOREIGN_KEY_CODE = 'P2003';

export function isUniqueViolation(error: unknown): boolean {
  return hasCode(error, UNIQUE_CONSTRAINT_CODE);
}

export function isForeignKeyViolation(error: unknown): boolean {
  return hasCode(error, FOREIGN_KEY_CODE);
}

function hasCode(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}
