import type { ExcerptSegment } from '@handle-it/contracts';

interface ExcerptTextProps {
  readonly segments: readonly ExcerptSegment[];
}

/** Extrait dont les mots trouvés sont mis en évidence ; le texte reste du texte, jamais du HTML. */
export function ExcerptText({ segments }: ExcerptTextProps) {
  return (
    <>
      {segments.map((segment, index) =>
        segment.isMatch ? (
          <mark key={index} className="rounded-sm bg-label-yellow px-0.5 text-on-label-yellow">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}
