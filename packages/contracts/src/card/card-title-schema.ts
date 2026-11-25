import { z } from 'zod';

const CARD_TITLE_MAX_LENGTH = 200;
const REQUIRED_MESSAGE = 'Le titre de la carte est obligatoire';

export const cardTitleSchema = z
  .string(REQUIRED_MESSAGE)
  .trim()
  .min(1, REQUIRED_MESSAGE)
  .max(
    CARD_TITLE_MAX_LENGTH,
    `Le titre de la carte est limité à ${CARD_TITLE_MAX_LENGTH} caractères`,
  );
