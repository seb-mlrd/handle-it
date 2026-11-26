import { type FieldErrors, groupFieldErrors } from '@handle-it/contracts';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { z } from 'zod';
import { ApiError, type ApiErrorCode } from '../http/api-error';
import { getErrorMessage } from '../http/error-message';

interface SchemaFormOptions<Input> {
  readonly schema: z.ZodType<Input>;
  readonly submit: (input: Input) => Promise<unknown>;
  /** Ajouts en série : le champ se vide à l'envoi, sans attendre la réponse pour le suivant. */
  readonly isSerial?: boolean;
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
    if (isPending && !options.isSerial) return;
    setFormError(null);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const result = options.schema.safeParse(values);
    setFieldErrors(result.success ? {} : groupFieldErrors(result.error));
    if (!result.success) return;
    if (options.isSerial) event.currentTarget.reset();
    setIsPending(true);
    try {
      await options.submit(result.data);
    } catch (error) {
      showFailure(error);
      if (options.isSerial) restoreEmptyFields(formReference.current, values);
    } finally {
      setIsPending(false);
    }
  };

  return {
    formReference,
    fieldErrors,
    formError,
    isPending: isPending && !options.isSerial,
    handleSubmit,
  };
}

/** Rend une saisie refusée, sauf si l'utilisateur a déjà commencé la suivante. */
function restoreEmptyFields(
  form: HTMLFormElement | null,
  values: Record<string, FormDataEntryValue>,
): void {
  for (const [name, value] of Object.entries(values)) {
    const field = form?.elements.namedItem(name);
    if (field instanceof HTMLInputElement && field.value === '' && typeof value === 'string') {
      field.value = value;
    }
  }
}
