import { LogOutButton } from '../auth/log-out-button';
import { BoardList } from './board-list';
import { CreateBoardForm } from './create-board-form';

export function BoardsPage() {
  return (
    <>
      <title>Mes tableaux · Handle It</title>
      <header className="flex items-center justify-between gap-4 border-b border-line bg-surface px-6 py-3">
        <p className="text-lg font-bold">Handle It</p>
        <LogOutButton />
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <h1 className="text-display font-bold">Mes tableaux</h1>
        <CreateBoardForm />
        <BoardList />
      </main>
    </>
  );
}
