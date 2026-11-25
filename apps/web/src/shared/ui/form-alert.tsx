interface FormAlertProps {
  readonly message: string | null;
}

/** Reste toujours présent : un lecteur d'écran n'annonce que les changements d'une zone connue. */
export function FormAlert({ message }: FormAlertProps) {
  return (
    <div role="alert">
      {message && (
        <p className="rounded-control border border-danger px-3 py-2 text-sm text-danger">
          {message}
        </p>
      )}
    </div>
  );
}
