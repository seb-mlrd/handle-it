import { useId } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Modal } from '../../shared/ui/modal';
import { SheetHeader } from '../../shared/ui/sheet-header';
import { useBoardLabels, useCreateLabel } from '../board-view/use-board-content';
import { LabelForm } from './label-form';
import { LabelItem } from './label-item';

/** Labels du board, ouverts par leur propre adresse. */
export function LabelsPanel() {
  const { boardId = '' } = useParams();
  const titleId = useId();
  const navigate = useNavigate();
  const { data: labels = [] } = useBoardLabels(boardId);
  const createLabel = useCreateLabel(boardId);
  const close = () => void navigate(`/boards/${boardId}`);
  return (
    <Modal titleId={titleId} placement="side" close={close}>
      <SheetHeader titleId={titleId} title="Labels" close={close} />
      <div className="flex flex-col gap-8">
        <section aria-label="Nouveau label" className="flex flex-col gap-3">
          <h3 className="text-headline font-semibold">Nouveau label</h3>
          <LabelForm submitLabel="Créer le label" submit={createLabel.mutateAsync} />
        </section>
        {labels.length === 0 ? (
          <p className="text-muted">Aucun label pour l'instant.</p>
        ) : (
          <ul aria-label="Labels du tableau" className="flex flex-col divide-y divide-line">
            {labels.map((label) => (
              <LabelItem key={label.id} boardId={boardId} label={label} />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
