import { lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthGateway } from './features/auth/auth-gateway';
import { AuthGatewayContext } from './features/auth/auth-gateway-context';
import { GuestRoute } from './features/auth/guest-route';
import { LogInPage } from './features/auth/log-in.page';
import { ProtectedRoute } from './features/auth/protected-route';
import { RegisterPage } from './features/auth/register.page';
import { createQueryClient } from './features/auth/create-query-client';
import { BoardContentGateway } from './features/board-view/board-content-gateway';
import { BoardContentGatewayContext } from './features/board-view/board-content-gateway-context';
import { BoardRealtimeGateway } from './features/board-view/board-realtime-gateway';
import { BoardRealtimeGatewayContext } from './features/board-view/board-realtime-gateway-context';
import { BoardGateway } from './features/boards/board-gateway';
import { BoardGatewayContext } from './features/boards/board-gateway-context';
import { BoardsPage } from './features/boards/boards.page';
import { CommentGateway } from './features/comments/comment-gateway';
import { SearchGateway } from './features/search/search-gateway';
import { SearchGatewayContext } from './features/search/search-gateway-context';
import { SEARCH_PATH } from './features/search/search-path';
import { CommentGatewayContext } from './features/comments/comment-gateway-context';
import { INVITATION_PATH } from './features/invitation/invitation-link';
import { MemberGateway } from './features/members/member-gateway';
import { MemberGatewayContext } from './features/members/member-gateway-context';
import { SkipLink } from './features/layout/skip-link';
import { PageLoading } from './features/layout/page-loading';
import { ApiClient } from './shared/http/api-client';

// Pages chargées à la demande : la connexion n'attend ni le glisser-déposer ni le temps réel.
const BoardViewPage = lazy(() =>
  import('./features/board-view/board-view.page').then((module) => ({
    default: module.BoardViewPage,
  })),
);
const CardPanel = lazy(() =>
  import('./features/board-view/card-panel').then((module) => ({ default: module.CardPanel })),
);
const MembersPanel = lazy(() =>
  import('./features/members/members-panel').then((module) => ({ default: module.MembersPanel })),
);
const InvitationPage = lazy(() =>
  import('./features/invitation/invitation.page').then((module) => ({
    default: module.InvitationPage,
  })),
);
const ActivityPanel = lazy(() =>
  import('./features/activity/activity-panel').then((module) => ({
    default: module.ActivityPanel,
  })),
);
const SearchPage = lazy(() =>
  import('./features/search/search.page').then((module) => ({ default: module.SearchPage })),
);
const LabelsPanel = lazy(() =>
  import('./features/labels/labels-panel').then((module) => ({ default: module.LabelsPanel })),
);
const queryClient = createQueryClient();
// fetch perd son contexte une fois stocké dans un objet : il est appelé via une fonction.
const apiClient = new ApiClient((...request) => fetch(...request));
const authGateway = new AuthGateway(apiClient);
const boardGateway = new BoardGateway(apiClient);
const boardRealtimeGateway = new BoardRealtimeGateway();
const memberGateway = new MemberGateway(apiClient);
const boardContentGateway = new BoardContentGateway(apiClient);
const commentGateway = new CommentGateway(apiClient);
const searchGateway = new SearchGateway(apiClient);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGatewayContext value={authGateway}>
        <BoardGatewayContext value={boardGateway}>
          <BoardContentGatewayContext value={boardContentGateway}>
            <CommentGatewayContext value={commentGateway}>
              <SearchGatewayContext value={searchGateway}>
                <MemberGatewayContext value={memberGateway}>
                  <BoardRealtimeGatewayContext value={boardRealtimeGateway}>
                    <BrowserRouter>
                      <SkipLink />
                      <Suspense fallback={<PageLoading />}>
                        <Routes>
                          <Route element={<GuestRoute />}>
                            <Route path="/login" element={<LogInPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                          </Route>
                          <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<BoardsPage />} />
                            <Route path={INVITATION_PATH} element={<InvitationPage />} />
                            <Route path={SEARCH_PATH} element={<SearchPage />} />
                            <Route path="/boards/:boardId" element={<BoardViewPage />}>
                              <Route path="cards/:cardId" element={<CardPanel />} />
                              <Route path="members" element={<MembersPanel />} />
                              <Route path="activity" element={<ActivityPanel />} />
                              <Route path="labels" element={<LabelsPanel />} />
                            </Route>
                          </Route>
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </Suspense>
                    </BrowserRouter>
                  </BoardRealtimeGatewayContext>
                </MemberGatewayContext>
              </SearchGatewayContext>
            </CommentGatewayContext>
          </BoardContentGatewayContext>
        </BoardGatewayContext>
      </AuthGatewayContext>
    </QueryClientProvider>
  );
}
