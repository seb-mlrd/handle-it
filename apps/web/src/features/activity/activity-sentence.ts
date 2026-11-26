import type { ActivityDetails } from '@handle-it/contracts';
import { formatDueDate } from '../due-date/due-date-status';

/** Phrase lue après le nom de l'auteur : « Ada a créé la carte « Pain » dans « À faire » ». */
export function describeActivity(details: ActivityDetails): string {
  switch (details.type) {
    case 'board-renamed':
      return `a renommé le tableau en « ${details.boardName} »`;
    case 'column-created':
      return `a créé la colonne « ${details.columnName} »`;
    case 'column-renamed':
      return `a renommé une colonne en « ${details.columnName} »`;
    case 'column-moved':
      return `a déplacé la colonne « ${details.columnName} »`;
    case 'column-deleted':
      return `a supprimé la colonne « ${details.columnName} »`;
    case 'card-created':
      return `a créé la carte « ${details.cardTitle} » dans « ${details.columnName} »`;
    case 'card-updated':
      return `a modifié la carte « ${details.cardTitle} »`;
    case 'card-moved':
      return `a déplacé la carte « ${details.cardTitle} » vers « ${details.columnName} »`;
    case 'card-deleted':
      return `a supprimé la carte « ${details.cardTitle} »`;
    case 'label-created':
      return `a créé le label « ${details.labelName} »`;
    case 'label-updated':
      return `a modifié le label « ${details.labelName} »`;
    case 'label-deleted':
      return `a supprimé le label « ${details.labelName} »`;
    case 'card-label-added':
      return `a posé le label « ${details.labelName} » sur « ${details.cardTitle} »`;
    case 'card-label-removed':
      return `a retiré le label « ${details.labelName} » de « ${details.cardTitle} »`;
    case 'card-due-set':
      return `a fixé l'échéance de « ${details.cardTitle} » au ${formatDueDate(details.dueOn)}`;
    case 'card-due-removed':
      return `a retiré l'échéance de « ${details.cardTitle} »`;
    case 'comment-added':
      return `a commenté la carte « ${details.cardTitle} »`;
    case 'comment-updated':
      return `a modifié un commentaire sur « ${details.cardTitle} »`;
    case 'comment-deleted':
      return `a supprimé un commentaire de « ${details.cardTitle} »`;
    case 'member-joined':
      return 'a rejoint le tableau';
    case 'member-left':
      return 'a quitté le tableau';
    case 'member-removed':
      return `a retiré ${details.memberName} du tableau`;
  }
}

/** Nom affiché quand le compte de l'auteur n'existe plus. */
export const FORMER_MEMBER_NAME = 'Ancien membre';
