import { type FieldErrors, groupFieldErrors } from '@handle-it/contracts';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { z } from 'zod';
import { ApiError, type ApiErrorCode } from '../http/api-error';
import { getErrorMessage } from '../http/error-message';

interface SchemaFormOptions<Input> {
  readonly schema: z.ZodType<Input>;
  readonly submit: (input: Input) => Promise<unknown>;
  /** Vide le formulaire après un envoi réussi. */
  readonly resetOnSuccess?: boolean;
  /** Codes d'erreur à afficher sous un champ plutôt qu'en tête du formulaire. */
  readonly fieldByErrorCode?: Partial<Record<ApiErrorCode, string>>;
}

/** Formulaire validé par un schéma partagé ; l'API reste seule juge. */
export function useSchemaForm<Input>(options: SchemaFormOptions<Input>) {
  const formReference = useRef<HTMLFormElement>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Après un échec, le clavier et le lecteur d'écran sont menés au premier champ à corriger.
  useEffect(() => {
    formReference.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [fieldErrors]);

  const showFailure = (error: unknown) => {
    const isApiError = error instanceof ApiError;
    const field = isApiError ? options.fieldByErrorCode?.[error.getCode()] : undefined;
    if (field) {
      setFieldErrors({ [field]: [getErrorMessage(error)] });
      return;
    }
    if (isApiError) setFieldErrors(error.getFieldErrors());
    setFormError(getErrorMessage(error));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;
    setFormError(null);
    const result = options.schema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    setFieldErrors(result.success ? {} : groupFieldErrors(result.error));
    if (!result.success) return;
    setIsPending(true);
    try {
      await options.submit(result.data);
      if (options.resetOnSuccess) formReference.current?.reset();
    } catch (error) {
      showFailure(error);
    } finally {
      setIsPending(false);
    }
  };

  return { formReference, fieldErrors, formError, isPending, handleSubmit };
}
