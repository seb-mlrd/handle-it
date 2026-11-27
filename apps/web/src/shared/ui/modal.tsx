import { type ReactNode, type SyntheticEvent, useEffect, useRef } from 'react';

type ModalPlacement = 'center' | 'side';

// Le panneau latéral flotte à quelques pixels des bords ; sur un téléphone, il prend tout l'écran.
const PLACEMENT_CLASSES: Record<ModalPlacement, string> = {
  center: 'm-auto max-w-md rounded-sheet p-6',
  side: 'mr-0 ml-auto h-dvh max-h-none max-w-lg px-6 pb-6 sm:my-2 sm:mr-2 sm:h-[calc(100dvh-1rem)] sm:rounded-sheet',
};

interface ModalProps {
  readonly titleId: string;
  readonly placement?: ModalPlacement;
  /** Empêche Échap de fermer, par exemple pour protéger une saisie. */
  readonly isEscapeBlocked?: boolean;
  readonly close: () => void;
  readonly children: ReactNode;
}

/** Fenêtre modale native : focus retenu, puis rendu à l'élément qui l'avait à l'ouverture. */
export function Modal({
  titleId,
  placement = 'center',
  isEscapeBlocked = false,
  close,
  children,
}: ModalProps) {
  const dialogReference = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogReference.current;
    const opener = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      // La fenêtre est déjà retirée de la page quand elle se ferme ici : le navigateur ne rend plus
      // le focus de lui-même.
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  const handleClose = (event: SyntheticEvent<HTMLDialogElement>) => {
    // En développement, React monte deux fois : l'événement de la première fermeture arrive après
    // la réouverture et ne doit pas fermer la fenêtre.
    if (!event.currentTarget.open) close();
  };

  return (
    <dialog
      ref={dialogReference}
      aria-labelledby={titleId}
      onCancel={(event) => isEscapeBlocked && event.preventDefault()}
      onClose={handleClose}
      data-placement={placement}
      className={`modal w-full overscroll-contain bg-surface text-ink shadow-overlay ${PLACEMENT_CLASSES[placement]}`}
    >
      {children}
    </dialog>
  );
}
