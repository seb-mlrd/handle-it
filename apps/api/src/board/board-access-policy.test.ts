import { describe, expect, it } from 'vitest';
import { BoardAccessPolicy } from './board-access-policy.js';
import { BoardActionForbiddenError } from './errors/board-action-forbidden.error.js';
import { BoardNotFoundError } from './errors/board-not-found.error.js';
import { Membership } from './membership.entity.js';

const policy = new BoardAccessPolicy();

describe.each(['rename-board', 'delete-board', 'manage-members'] as const)(
  'BoardAccessPolicy : %s',
  (action) => {
    it("autorise l'owner", () => {
      const owner = new Membership('board', 'ada', 'owner');
      expect(policy.authorize(owner, action)).toBe(owner);
    });

    it('refuse un membre', () => {
      const member = new Membership('board', 'bob', 'member');
      expect(() => policy.authorize(member, action)).toThrow(BoardActionForbiddenError);
    });

    it("cache l'existence du board à un non-membre", () => {
      expect(() => policy.authorize(null, action)).toThrow(BoardNotFoundError);
    });
  },
);

describe.each(['view-board', 'edit-content'] as const)('BoardAccessPolicy : %s', (action) => {
  it.each(['owner', 'member'] as const)('autorise le rôle %s', (role) => {
    const membership = new Membership('board', 'ada', role);
    expect(policy.authorize(membership, action)).toBe(membership);
  });

  it("cache l'existence du board à un non-membre", () => {
    expect(() => policy.authorize(null, action)).toThrow(BoardNotFoundError);
  });
});

it("laisse un membre quitter le board, mais pas l'owner", () => {
  const member = new Membership('board', 'bob', 'member');
  const owner = new Membership('board', 'ada', 'owner');
  expect(policy.authorize(member, 'leave-board')).toBe(member);
  expect(() => policy.authorize(owner, 'leave-board')).toThrow(BoardActionForbiddenError);
});
