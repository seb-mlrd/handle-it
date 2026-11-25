import {
  type CreateInvitationRequest,
  createInvitationRequestSchema,
  type InvitationDuration,
  invitationDurationSchema,
} from '@handle-it/contracts';
import { useSchemaForm } from '../../shared/forms/use-schema-form';
import { Button } from '../../shared/ui/button';
import { FormAlert } from '../../shared/ui/form-alert';
import { SelectField } from '../../shared/ui/select-field';

const DEFAULT_DURATION: InvitationDuration = 'one-day';

const DURATION_LABELS: Record<InvitationDuration, string> = {
  'one-hour': '1 heure',
  'one-day': '1 jour',
  'seven-days': '7 jours',
};

interface CreateInvitationFormProps {
  readonly submit: (request: CreateInvitationRequest) => Promise<unknown>;
}

export function CreateInvitationForm({ submit }: CreateInvitationFormProps) {
  const form = useSchemaForm({ schema: createInvitationRequestSchema, submit });
  return (
    <form
      ref={form.formReference}
      noValidate
      onSubmit={(event) => void form.handleSubmit(event)}
      className="flex flex-col gap-4"
    >
      <FormAlert message={form.formError} />
      <SelectField
        label="Durée de validité"
        name="duration"
        defaultValue={DEFAULT_DURATION}
        errors={form.fieldErrors['duration']}
      >
        {invitationDurationSchema.options.map((duration) => (
          <option key={duration} value={duration}>
            {DURATION_LABELS[duration]}
          </option>
        ))}
      </SelectField>
      <div>
        <Button type="submit" disabled={form.isPending}>
          {form.isPending ? 'Création…' : 'Créer un lien'}
        </Button>
      </div>
    </form>
  );
}
