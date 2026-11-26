import { commentRequestSchema } from '@handle-it/contracts';
import { useSchemaForm } from '../../shared/forms/use-schema-form';
import { Button } from '../../shared/ui/button';
import { FormAlert } from '../../shared/ui/form-alert';
import { TextArea } from '../../shared/ui/text-area';
import { submitOnShortcut } from './submit-on-shortcut';
import { useAddComment } from './use-comments';

const COMPOSER_ROWS = 3;

interface CommentComposerProps {
  readonly boardId: string;
  readonly cardId: string;
}

/** Saisie d'un commentaire ; le texte n'est effacé qu'une fois l'envoi accepté. */
export function CommentComposer({ boardId, cardId }: CommentComposerProps) {
  const addComment = useAddComment(boardId, cardId);
  const form = useSchemaForm({
    schema: commentRequestSchema,
    submit: async (request) => {
      await addComment.mutateAsync(request);
      form.formReference.current?.reset();
    },
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
        label="Nouveau commentaire"
        name="body"
        rows={COMPOSER_ROWS}
        hint="Ctrl+Entrée pour envoyer"
        onKeyDown={submitOnShortcut}
        errors={form.fieldErrors['body']}
      />
      <div>
        <Button type="submit" disabled={form.isPending}>
          {form.isPending ? 'Envoi…' : 'Envoyer'}
        </Button>
      </div>
    </form>
  );
}
