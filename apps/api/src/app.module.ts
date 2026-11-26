import { Module } from '@nestjs/common';
import { BoardModule } from './board/board.module.js';
import { BoardViewModule } from './board-view/board-view.module.js';
import { CardModule } from './card/card.module.js';
import { ColumnModule } from './column/column.module.js';
import { EnvironmentModule } from './config/environment.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { ActivityModule } from './activity/activity.module.js';
import { AuthModule } from './auth/auth.module.js';
import { InvitationModule } from './invitation/invitation.module.js';
import { MemberModule } from './member/member.module.js';
import { RealtimeTransportModule } from './realtime/realtime-transport.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { SharedModule } from './shared/shared.module.js';
import { HttpModule } from './shared/http/http.module.js';

@Module({
  imports: [
    EnvironmentModule,
    DatabaseModule,
    HttpModule,
    SharedModule,
    RealtimeTransportModule,
    RealtimeModule,
    MemberModule,
    InvitationModule,
    AuthModule,
    BoardModule,
    ColumnModule,
    CardModule,
    BoardViewModule,
    ActivityModule,
    HealthModule,
  ],
})
export class AppModule {}
