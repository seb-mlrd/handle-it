import type { ReactNode } from 'react';
import { LANDING_PATH } from '../layout/landing-path';
import { BoardIllustration } from './board-illustration';
import { BrandMark } from '../layout/brand-mark';
import { MAIN_CONTENT_ID } from '../layout/skip-link';

interface AuthLayoutProps {
  readonly title: string;
  readonly children: ReactNode;
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="outline-none flex flex-col px-6 py-8 sm:px-12"
      >
        <a
          href={LANDING_PATH}
          className="flex h-11 items-center gap-2.5 self-start rounded-control pr-2 text-lg font-bold tracking-[-0.01em]"
        >
          <BrandMark />
          Handle It
        </a>
        <div className="m-auto flex w-full max-w-sm flex-col gap-6 py-10">
          <h1 className="text-display font-bold">{title}</h1>
          {children}
        </div>
      </main>
      <div className="m-2 hidden items-center justify-center rounded-sheet bg-[color-mix(in_oklab,var(--color-accent)_16%,var(--color-surface))] p-12 lg:flex">
        <BoardIllustration />
      </div>
    </div>
  );
}
