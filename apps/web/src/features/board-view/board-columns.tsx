import {
  DndContext,
  type DropAnimation,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import type { BoardViewResponse } from '@handle-it/contracts';
import { getErrorMessage } from '../../shared/http/error-message';
import { FormAlert } from '../../shared/ui/form-alert';
import { AddColumn } from './add-column';
import { BoardColumn } from './board-column';
import { createAnnouncements, SCREEN_READER_INSTRUCTIONS } from './drag-announcements';
import { detectCollisions } from './drag-collision';
import { getKeyboardCoordinates } from './drag-keyboard';
import { DragPreview } from './drag-preview';
import { useBoardDrag } from './use-board-drag';
import { useLoadedBoard } from './use-board-content';
import { useReducedMotion } from './use-reduced-motion';

// Un léger mouvement ou un appui prolongé distingue un déplacement d'un clic ou d'un défilement.
const MOUSE_OPTIONS = { activationConstraint: { distance: 6 } };
const TOUCH_OPTIONS = { activationConstraint: { delay: 200, tolerance: 8 } };
const KEYBOARD_OPTIONS = {
  coordinateGetter: getKeyboardCoordinates,
  // Entrée reste réservée à l'ouverture d'une carte.
  keyboardCodes: {
    start: [KeyboardCode.Space],
    cancel: [KeyboardCode.Esc],
    end: [KeyboardCode.Space, KeyboardCode.Enter],
  },
};
// Les cartes changent de colonne pendant le geste : les positions doivent être remesurées.
const MEASURING = { droppable: { strategy: MeasuringStrategy.Always } };
const DROP_ANIMATION: DropAnimation = { duration: 220, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' };

interface BoardColumnsProps {
  readonly boardId: string;
}

export function BoardColumns({ boardId }: BoardColumnsProps) {
  // Lu ici plutôt que reçu : au lâcher, l'ordre enregistré remplace le brouillon sans clignoter.
  const { data: board } = useLoadedBoard(boardId, (loaded) => loaded);
  return board ? <BoardColumnsContent board={board} /> : null;
}

interface BoardColumnsContentProps {
  readonly board: BoardViewResponse;
}

function BoardColumnsContent({ board }: BoardColumnsContentProps) {
  const isMotionReduced = useReducedMotion();
  const drag = useBoardDrag(board.id, board.columns);
  const sensors = useSensors(
    useSensor(MouseSensor, MOUSE_OPTIONS),
    useSensor(TouchSensor, TOUCH_OPTIONS),
    useSensor(KeyboardSensor, KEYBOARD_OPTIONS),
  );
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={detectCollisions}
      measuring={MEASURING}
      accessibility={{
        announcements: createAnnouncements(() => drag.columns),
        screenReaderInstructions: SCREEN_READER_INSTRUCTIONS,
      }}
      onDragStart={drag.handleDragStart}
      onDragOver={drag.handleDragOver}
      onDragEnd={drag.handleDragEnd}
      onDragCancel={drag.cancelDrag}
    >
      <div className="px-6 empty:hidden">
        <FormAlert message={drag.error && `Déplacement annulé. ${getErrorMessage(drag.error)}`} />
      </div>
      <SortableContext
        items={drag.columns.map(({ id }) => id)}
        strategy={horizontalListSortingStrategy}
      >
        <ul
          aria-label="Colonnes"
          className={`flex min-h-0 grow scroll-px-6 items-start gap-4 overflow-x-auto px-6 pb-4 ${drag.draggedItem ? '' : 'snap-x'}`}
        >
          {drag.columns.map((column) => (
            <BoardColumn key={column.id} boardId={board.id} column={column} />
          ))}
          <AddColumn boardId={board.id} isFirst={board.columns.length === 0} />
        </ul>
      </SortableContext>
      <DragOverlay dropAnimation={isMotionReduced ? null : DROP_ANIMATION}>
        {drag.draggedItem && <DragPreview item={drag.draggedItem} columns={drag.columns} />}
      </DragOverlay>
    </DndContext>
  );
}
