import { createContext, useContext } from 'react';
import type { MemberGateway } from './member-gateway';

export const MemberGatewayContext = createContext<MemberGateway | null>(null);

export function useMemberGateway(): MemberGateway {
  const memberGateway = useContext(MemberGatewayContext);
  if (!memberGateway) {
    throw new Error('MemberGatewayContext doit être fourni au-dessus de ce composant');
  }
  return memberGateway;
}
