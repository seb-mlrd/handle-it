import type { Active, Announcements, Over, ScreenReaderInstructions } from '@dnd-kit/core';
import type { Columns } from './board-order';
import { findColumnOfCard } from './board-order';
import { readDragItem } from './drag-item';

export const SCREEN_READER_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    'Pour déplacer, appuie sur Espace, puis utilise les flèches. Espace ou Entrée pour déposer, Échap pour annuler.',
};

/** Annonces pour lecteurs d'écran, lues sur l'ordre affiché au moment de l'annonce. */
export function createAnnouncements(getColumns: () => Columns): Announcements {
  const describeName = (active: Active) => {
    const item = readDragItem(active);
    const columns = getColumns();
    if (item?.type === 'column') {
      return `colonne ${columns.find(({ id }) => id === item.id)?.name ?? ''}`;
    }
    const cards = findColumnOfCard(columns, String(active.id))?.cards;
    return `carte ${cards?.find(({ id }) => id === active.id)?.title ?? ''}`;
  };
  const describePlace = (over: Over | null) => {
    const item = readDragItem(over);
    if (!item) return 'hors du tableau';
    const columns = getColumns();
    if (item.type === 'column') {
      const index = columns.findIndex(({ id }) => id === item.id);
      return `sur la colonne ${columns[index]?.name ?? ''}, position ${index + 1} sur ${columns.length}`;
    }
    const column = findColumnOfCard(columns, item.id);
    const index = column?.cards.findIndex(({ id }) => id === item.id) ?? 0;
    return `dans la colonne ${column?.name ?? ''}, position ${index + 1} sur ${column?.cards.length ?? 0}`;
  };
  return {
    onDragStart: ({ active }) => `Déplacement commencé : ${describeName(active)}.`,
    onDragOver: ({ active, over }) => `${describeName(active)} : ${describePlace(over)}.`,
    onDragEnd: ({ active, over }) => `Déposé : ${describeName(active)}, ${describePlace(over)}.`,
    onDragCancel: ({ active }) => `Déplacement annulé : ${describeName(active)}.`,
  };
}
