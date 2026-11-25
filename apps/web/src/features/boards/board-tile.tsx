import type { BoardResponse, BoardRole } from '@handle-it/contracts';
import { useState } from 'react';
import { Button } from '../../shared/ui/button';
import { DeleteBoardDialog } from './delete-board-dialog';
import { RenameBoardForm } from './rename-board-form';

const ROLE_LABELS: Record<BoardRole, string> = { owner: 'Propriétaire', member: 'Membre' };

interface BoardTileProps {
  readonly board: BoardResponse;
}

export function BoardTile({ board }: BoardTileProps) {
  const [openPanel, setOpenPanel] = useState<'rename' | 'delete' | null>(null);
  const close = () => setOpenPanel(null);
  return (
    <li className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
      {openPanel === 'rename' ? (
        <RenameBoardForm board={board} close={close} />
      ) : (
        <>
          <div className="grow">
            <h2 className="text-lg font-semibold wrap-anywhere">{board.name}</h2>
            <p className="text-sm text-muted">{ROLE_LABELS[board.role]}</p>
          </div>
          {board.role === 'owner' && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                aria-label={`Renommer ${board.name}`}
                onClick={() => setOpenPanel('rename')}
              >
                Renommer
              </Button>
              <Button
                variant="secondary"
                aria-label={`Supprimer ${board.name}`}
                onClick={() => setOpenPanel('delete')}
              >
                Supprimer
              </Button>
            </div>
          )}
        </>
      )}
      {openPanel === 'delete' && <DeleteBoardDialog board={board} close={close} />}
    </li>
  );
}
