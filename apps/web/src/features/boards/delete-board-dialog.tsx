import type { BoardResponse } from '@handle-it/contracts';
import { useEffect, useId, useRef } from 'react';
import { getErrorMessage } from '../../shared/http/error-message';
import { Button } from '../../shared/ui/button';
import { FormAlert } from '../../shared/ui/form-alert';
import { useDeleteBoard } from './use-boards';

interface DeleteBoardDialogProps {
  readonly board: BoardResponse;
  readonly close: () => void;
}

/** Demande confirmation : la suppression emporte tout le contenu du board. */
export function DeleteBoardDialog({ board, close }: DeleteBoardDialogProps) {
  const titleId = useId();
  const dialogReference = useRef<HTMLDialogElement>(null);
  const deleteBoard = useDeleteBoard(board.id);

  useEffect(() => {
    const dialog = dialogReference.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogReference}
      aria-labelledby={titleId}
      onClose={close}
      className="m-auto w-full max-w-md rounded-card border border-line bg-surface p-6 text-ink backdrop:bg-black/60"
    >
      <h2 id={titleId} className="text-xl font-bold wrap-anywhere">
        Supprimer « {board.name} » ?
      </h2>
      <p className="mt-2 mb-4 text-muted">
        Le tableau et tout son contenu seront supprimés pour tous ses membres. Cette action est
        définitive.
      </p>
      <FormAlert message={deleteBoard.error && getErrorMessage(deleteBoard.error)} />
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={close}>
          Annuler
        </Button>
        <Button
          variant="danger"
          disabled={deleteBoard.isPending}
          onClick={() => deleteBoard.mutate(undefined, { onSuccess: close })}
        >
          {deleteBoard.isPending ? 'Suppression…' : 'Supprimer'}
        </Button>
      </div>
    </dialog>
  );
}
