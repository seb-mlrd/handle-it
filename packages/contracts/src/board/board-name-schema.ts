import { z } from 'zod';

const BOARD_NAME_MAX_LENGTH = 80;
const REQUIRED_MESSAGE = 'Le nom du tableau est obligatoire';

export const boardNameSchema = z
  .string(REQUIRED_MESSAGE)
  .trim()
  .min(1, REQUIRED_MESSAGE)
  .max(BOARD_NAME_MAX_LENGTH, `Le nom du tableau est limité à ${BOARD_NAME_MAX_LENGTH} caractères`);
