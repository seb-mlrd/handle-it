import { AppHeader } from '../layout/app-header';
import { BoardList } from './board-list';
import { CreateBoardForm } from './create-board-form';

export function BoardsPage() {
  return (
    <>
      <title>Mes tableaux · Handle It</title>
      <AppHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <h1 className="text-display font-bold">Mes tableaux</h1>
        <CreateBoardForm />
        <BoardList />
      </main>
    </>
  );
}
