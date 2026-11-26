import {
  type LabelColor,
  labelColorSchema,
  type LabelRequest,
  labelRequestSchema,
  type LabelResponse,
} from '@handle-it/contracts';
import { useSchemaForm } from '../../shared/forms/use-schema-form';
import { Button } from '../../shared/ui/button';
import { FormAlert } from '../../shared/ui/form-alert';
import { SelectField } from '../../shared/ui/select-field';
import { TextField } from '../../shared/ui/text-field';
import { LABEL_COLOR_NAMES } from './label-colors';

const DEFAULT_COLOR: LabelColor = 'blue';

interface LabelFormProps {
  readonly label?: LabelResponse;
  readonly submitLabel: string;
  readonly submit: (request: LabelRequest) => Promise<unknown>;
  readonly close?: () => void;
}

/** Nom et couleur d'un label, à la création comme à la modification. */
export function LabelForm({ label, submitLabel, submit, close }: LabelFormProps) {
  const form = useSchemaForm({
    schema: labelRequestSchema,
    submit,
    fieldByErrorCode: { LABEL_NAME_TAKEN: 'name' },
    // À la création, le formulaire se vide pour enchaîner ; à la modification, il se ferme.
    isSerial: !label,
  });
  return (
    <form
      ref={form.formReference}
      noValidate
      onSubmit={(event) => void form.handleSubmit(event)}
      onKeyDown={(event) => event.key === 'Escape' && close?.()}
      className="flex flex-col gap-3"
    >
      <FormAlert message={form.formError} />
      <TextField
        label="Nom du label"
        name="name"
        autoComplete="off"
        autoFocus={Boolean(label)}
        defaultValue={label?.name}
        errors={form.fieldErrors['name']}
      />
      <SelectField
        label="Couleur"
        name="color"
        defaultValue={label?.color ?? DEFAULT_COLOR}
        errors={form.fieldErrors['color']}
      >
        {labelColorSchema.options.map((color) => (
          <option key={color} value={color}>
            {LABEL_COLOR_NAMES[color]}
          </option>
        ))}
      </SelectField>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={form.isPending}>
          {submitLabel}
        </Button>
        {close && (
          <Button variant="secondary" onClick={close}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
