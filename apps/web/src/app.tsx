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
import { BoardViewPage } from './features/board-view/board-view.page';
import { CardPanel } from './features/board-view/card-panel';
import { BoardGateway } from './features/boards/board-gateway';
import { BoardGatewayContext } from './features/boards/board-gateway-context';
import { BoardsPage } from './features/boards/boards.page';
import { INVITATION_PATH } from './features/invitation/invitation-link';
import { InvitationPage } from './features/invitation/invitation.page';
import { MemberGateway } from './features/members/member-gateway';
import { MemberGatewayContext } from './features/members/member-gateway-context';
import { MembersPanel } from './features/members/members-panel';
import { ApiClient } from './shared/http/api-client';

const queryClient = createQueryClient();
// fetch perd son contexte une fois stocké dans un objet : il est appelé via une fonction.
const apiClient = new ApiClient((...request) => fetch(...request));
const authGateway = new AuthGateway(apiClient);
const boardGateway = new BoardGateway(apiClient);
const memberGateway = new MemberGateway(apiClient);
const boardContentGateway = new BoardContentGateway(apiClient);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGatewayContext value={authGateway}>
        <BoardGatewayContext value={boardGateway}>
          <BoardContentGatewayContext value={boardContentGateway}>
            <MemberGatewayContext value={memberGateway}>
              <BrowserRouter>
                <Routes>
                  <Route element={<GuestRoute />}>
                    <Route path="/login" element={<LogInPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                  </Route>
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<BoardsPage />} />
                    <Route path={INVITATION_PATH} element={<InvitationPage />} />
                    <Route path="/boards/:boardId" element={<BoardViewPage />}>
                      <Route path="cards/:cardId" element={<CardPanel />} />
                      <Route path="members" element={<MembersPanel />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </MemberGatewayContext>
          </BoardContentGatewayContext>
        </BoardGatewayContext>
      </AuthGatewayContext>
    </QueryClientProvider>
  );
}
