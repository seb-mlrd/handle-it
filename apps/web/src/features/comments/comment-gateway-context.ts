import { createContext, useContext } from 'react';
import type { CommentGateway } from './comment-gateway';

export const CommentGatewayContext = createContext<CommentGateway | null>(null);

export function useCommentGateway(): CommentGateway {
  const commentGateway = useContext(CommentGatewayContext);
  if (!commentGateway) {
    throw new Error('CommentGatewayContext doit être fourni au-dessus de ce composant');
  }
  return commentGateway;
}
