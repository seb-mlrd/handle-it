import type { ReactNode } from 'react';
import { BoardIllustration } from './board-illustration';

interface AuthLayoutProps {
  readonly title: string;
  readonly children: ReactNode;
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <main className="flex flex-col px-6 py-8 sm:px-12">
        <p className="text-lg font-bold">Handle It</p>
        <div className="m-auto flex w-full max-w-sm flex-col gap-6 py-10">
          <h1 className="text-display font-bold">{title}</h1>
          {children}
        </div>
      </main>
      <div className="hidden items-center justify-center border-l border-line bg-surface p-12 lg:flex">
        <BoardIllustration />
      </div>
    </div>
  );
}
