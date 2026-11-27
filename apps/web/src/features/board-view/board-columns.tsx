import {
  DndContext,
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
import { useMemo } from 'react';
import { getErrorMessage } from '../../shared/http/error-message';
import { FormAlert } from '../../shared/ui/form-alert';
import { AddColumn } from './add-column';
import { BoardColumn } from './board-column';
import { createAnnouncements, SCREEN_READER_INSTRUCTIONS } from './drag-announcements';
import { detectCollisions } from './drag-collision';
import { getKeyboardCoordinates } from './drag-keyboard';
import { DragPreview } from './drag-preview';
import { createDropAnimation } from './drop-animation';
import type { Columns } from './board-order';
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

/** Cartes affichées : un filtre en masque, sans jamais masquer de colonne. */
type SelectVisibleColumns = (columns: Columns) => Columns;

interface BoardColumnsProps {
  readonly boardId: string;
  readonly selectVisibleColumns: SelectVisibleColumns;
}

export function BoardColumns({ boardId, selectVisibleColumns }: BoardColumnsProps) {
  // Lu ici plutôt que reçu : au lâcher, l'ordre enregistré remplace le brouillon sans clignoter.
  const { data: board } = useLoadedBoard(boardId, (loaded) => loaded);
  return board ? (
    <BoardColumnsContent board={board} visibleColumns={selectVisibleColumns(board.columns)} />
  ) : null;
}

interface BoardColumnsContentProps {
  readonly board: BoardViewResponse;
  readonly visibleColumns: Columns;
}

function BoardColumnsContent({ board, visibleColumns }: BoardColumnsContentProps) {
  const isMotionReduced = useReducedMotion();
  const dropAnimation = useMemo(createDropAnimation, []);
  const drag = useBoardDrag(board.id, board.columns, visibleColumns);
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
      {/* L'alerte reste dans la page pour être annoncée ; vide, elle ne double pas l'espacement. */}
      <div className="-mt-5 px-6 has-[p]:mt-0">
        <FormAlert message={drag.error && `Déplacement annulé. ${getErrorMessage(drag.error)}`} />
      </div>
      <SortableContext
        items={drag.columns.map(({ id }) => id)}
        strategy={horizontalListSortingStrategy}
      >
        <ul
          aria-label="Colonnes"
          className={`flex min-h-0 grow scroll-px-6 items-start gap-3 overflow-x-auto px-6 pt-1 pb-6 ${drag.draggedItem ? '' : 'snap-x'}`}
        >
          {drag.columns.map((column) => (
            <BoardColumn key={column.id} boardId={board.id} column={column} />
          ))}
          <AddColumn boardId={board.id} isFirst={board.columns.length === 0} />
        </ul>
      </SortableContext>
      <DragOverlay dropAnimation={isMotionReduced ? null : dropAnimation}>
        {drag.draggedItem && (
          <DragPreview boardId={board.id} item={drag.draggedItem} columns={drag.columns} />
        )}
      </DragOverlay>
    </DndContext>
  );
}
