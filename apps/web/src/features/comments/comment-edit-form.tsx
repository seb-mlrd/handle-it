import { commentRequestSchema } from '@handle-it/contracts';
import { useSchemaForm } from '../../shared/forms/use-schema-form';
import { Button } from '../../shared/ui/button';
import { FormAlert } from '../../shared/ui/form-alert';
import { TextArea } from '../../shared/ui/text-area';
import { submitOnShortcut } from './submit-on-shortcut';
import { useUpdateComment } from './use-comments';

const EDIT_ROWS = 3;

interface CommentEditFormProps {
  readonly boardId: string;
  readonly cardId: string;
  readonly commentId: string;
  /** Brouillon gardé par le fil : une relecture en direct ne l'efface pas. */
  readonly draft: string;
  readonly changeDraft: (draft: string) => void;
  readonly close: () => void;
}

export function CommentEditForm(props: CommentEditFormProps) {
  const updateComment = useUpdateComment(props.boardId, props.cardId, props.commentId);
  const form = useSchemaForm({
    schema: commentRequestSchema,
    submit: (request) => updateComment.mutateAsync(request).then(props.close),
  });
  return (
    <form
      ref={form.formReference}
      noValidate
      onSubmit={(event) => void form.handleSubmit(event)}
      className="flex flex-col gap-3"
    >
      <FormAlert message={form.formError} />
      <TextArea
        label="Modifier le commentaire"
        name="body"
        rows={EDIT_ROWS}
        autoFocus
        value={props.draft}
        onChange={(event) => props.changeDraft(event.target.value)}
        onKeyDown={submitOnShortcut}
        errors={form.fieldErrors['body']}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={form.isPending}>
          {form.isPending ? 'Enregistrement…' : 'Enregistrer le commentaire'}
        </Button>
        <Button variant="secondary" onClick={props.close}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
