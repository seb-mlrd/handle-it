interface EyeIconProps {
  readonly isCrossed: boolean;
}

export function EyeIcon({ isCrossed }: EyeIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 fill-none stroke-current stroke-2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      {isCrossed && <path d="m4 4 16 16" />}
    </svg>
  );
}
