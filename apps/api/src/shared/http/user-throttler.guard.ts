import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { User } from '../../user/user.entity.js';

/** Limite comptée par utilisateur connecté : plusieurs personnes peuvent partager une même IP. */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(request: Record<string, unknown>): Promise<string> {
    // `currentUser` est posé par la garde d'authentification, qui passe avant celle-ci.
    const { currentUser } = request;
    return currentUser instanceof User ? `user:${currentUser.getId()}` : super.getTracker(request);
  }
}
