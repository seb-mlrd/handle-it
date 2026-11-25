import { useId } from 'react';
import { getErrorMessage } from '../http/error-message';
import { Button } from './button';
import { FormAlert } from './form-alert';
import { Modal } from './modal';

interface ConfirmDeleteDialogProps {
  readonly title: string;
  readonly consequence: string;
  readonly error: unknown;
  readonly isPending: boolean;
  readonly confirm: () => void;
  readonly close: () => void;
}

/** Demande confirmation avant une suppression définitive. */
export function ConfirmDeleteDialog(props: ConfirmDeleteDialogProps) {
  const titleId = useId();
  return (
    <Modal titleId={titleId} close={props.close}>
      <h2 id={titleId} className="text-xl font-bold wrap-anywhere">
        {props.title}
      </h2>
      <p className="mt-2 mb-4 text-muted">{props.consequence}</p>
      <FormAlert message={props.error ? getErrorMessage(props.error) : null} />
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={props.close}>
          Annuler
        </Button>
        <Button variant="danger" disabled={props.isPending} onClick={props.confirm}>
          {props.isPending ? 'Suppression…' : 'Supprimer'}
        </Button>
      </div>
    </Modal>
  );
}
