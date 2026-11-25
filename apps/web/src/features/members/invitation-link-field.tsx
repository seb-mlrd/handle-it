import { useState } from 'react';
import { Button } from '../../shared/ui/button';
import { TextField } from '../../shared/ui/text-field';

interface InvitationLinkFieldProps {
  readonly link: string;
}

export function InvitationLinkField({ link }: InvitationLinkFieldProps) {
  const [copyResult, setCopyResult] = useState('');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopyResult('Lien copié.');
    } catch {
      // Presse-papiers refusé ou absent (page sans HTTPS) : le champ reste sélectionnable.
      setCopyResult('Copie impossible : sélectionne le lien et copie-le.');
    }
  };
  return (
    <div className="flex flex-col gap-3 rounded-card border border-line p-4">
      <TextField
        label="Lien d'invitation"
        hint="Copie-le maintenant : il ne sera plus affiché."
        value={link}
        readOnly
        onFocus={(event) => event.currentTarget.select()}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => void copy()}>
          Copier le lien
        </Button>
        <span role="status" className="text-sm text-muted">
          {copyResult}
        </span>
      </div>
    </div>
  );
}
