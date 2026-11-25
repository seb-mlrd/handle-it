import { registerRequestSchema } from '@handle-it/contracts';
import { z } from 'zod';

const passwordsSchema = z.object({ password: z.string(), passwordConfirmation: z.string() });

/** Inscription telle que saisie : la confirmation ne sert qu'à l'écran, l'API ne la reçoit pas. */
export const registerFormSchema = registerRequestSchema
  .extend({ passwordConfirmation: z.string('Confirme ton mot de passe') })
  .refine((form) => form.password === form.passwordConfirmation, {
    path: ['passwordConfirmation'],
    error: 'Les mots de passe ne correspondent pas',
    // Par défaut, Zod attendrait que tous les autres champs soient valides pour comparer.
    when: ({ value }) => passwordsSchema.safeParse(value).success,
  })
  .transform((form) => ({
    email: form.email,
    displayName: form.displayName,
    password: form.password,
  }));
