import { Module } from '@nestjs/common';
import { BoardAccessService } from '../board/board-access.service.js';
import { BoardModule } from '../board/board.module.js';
import { ActivityController } from './activity.controller.js';
import { ActivityRepository } from './activity.repository.js';
import { ActivityService } from './activity.service.js';

@Module({
  imports: [BoardModule],
  controllers: [ActivityController],
  providers: [
    {
      provide: ActivityService,
      useFactory: (...dependencies: ConstructorParameters<typeof ActivityService>) =>
        new ActivityService(...dependencies),
      inject: [ActivityRepository, BoardAccessService],
    },
  ],
})
export class ActivityModule {}
