import {
  type BoardResponse,
  boardResponseSchema,
  type CreatedInvitationResponse,
  type CreateInvitationRequest,
  createdInvitationResponseSchema,
  invitationListResponseSchema,
  type InvitationPreviewResponse,
  invitationPreviewResponseSchema,
  type InvitationResponse,
  memberListResponseSchema,
  type MemberResponse,
} from '@handle-it/contracts';
import type { ApiClient } from '../../shared/http/api-client';

/** Accès aux membres et aux invitations. */
export class MemberGateway {
  constructor(private readonly apiClient: ApiClient) {}

  listMembers(boardId: string): Promise<MemberResponse[]> {
    return this.apiClient.get(`/boards/${boardId}/members`, memberListResponseSchema);
  }

  removeMember(boardId: string, userId: string): Promise<void> {
    return this.apiClient.delete(`/boards/${boardId}/members/${userId}`);
  }

  leaveBoard(boardId: string): Promise<void> {
    return this.apiClient.delete(`/boards/${boardId}/membership`);
  }

  listInvitations(boardId: string): Promise<InvitationResponse[]> {
    return this.apiClient.get(`/boards/${boardId}/invitations`, invitationListResponseSchema);
  }

  createInvitation(
    boardId: string,
    request: CreateInvitationRequest,
  ): Promise<CreatedInvitationResponse> {
    const path = `/boards/${boardId}/invitations`;
    return this.apiClient.post(path, request, createdInvitationResponseSchema);
  }

  previewInvitation(token: string): Promise<InvitationPreviewResponse> {
    return this.apiClient.post('/invitations/preview', { token }, invitationPreviewResponseSchema);
  }

  acceptInvitation(token: string): Promise<BoardResponse> {
    return this.apiClient.post('/invitations/accept', { token }, boardResponseSchema);
  }
}
