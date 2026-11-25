import { useId, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../../shared/ui/button';
import { LoadError } from '../../shared/ui/load-error';
import { Modal } from '../../shared/ui/modal';
import { CardForm } from './card-form';
import { useCard } from './use-board-content';

/** Détail d'une carte, ouvert par-dessus son board et accessible par sa propre adresse. */
export function CardPanel() {
  const { boardId = '', cardId = '' } = useParams();
  const titleId = useId();
  const navigate = useNavigate();
  const [isDirty, setIsDirty] = useState(false);
  const { data: card, error, isFetching, refetch } = useCard(boardId, cardId);
  const close = () => void navigate(`/boards/${boardId}`);
  return (
    <Modal titleId={titleId} placement="side" isEscapeBlocked={isDirty} close={close}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-xl font-bold">
          Détail de la carte
        </h2>
        <Button variant="secondary" onClick={close}>
          {isDirty ? 'Fermer sans enregistrer' : 'Fermer'}
        </Button>
      </div>
      {card ? (
        <CardForm
          boardId={boardId}
          card={card}
          markAsDirty={() => setIsDirty(true)}
          close={close}
        />
      ) : error ? (
        <LoadError error={error} isRetrying={isFetching} retry={refetch} />
      ) : (
        <p role="status" className="text-muted">
          Chargement de la carte…
        </p>
      )}
    </Modal>
  );
}
