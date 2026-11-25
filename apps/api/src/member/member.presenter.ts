import type { MemberResponse } from '@handle-it/contracts';
import type { Member } from './member.js';

export function presentMember({ userId, displayName, role }: Member): MemberResponse {
  return { userId, displayName, role };
}
