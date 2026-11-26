interface CommentCountProps {
  readonly count: number;
}

/** Nombre de commentaires d'une carte, toujours écrit en toutes lettres. */
export function CommentCount({ count }: CommentCountProps) {
  if (count === 0) return null;
  return (
    <span className="mt-2 block text-sm text-muted">
      {count} {count === 1 ? 'commentaire' : 'commentaires'}
    </span>
  );
}
