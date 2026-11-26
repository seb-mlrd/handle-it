import { Module } from '@nestjs/common';
import { BoardAccessService } from '../board/board-access.service.js';
import { BoardModule } from '../board/board.module.js';
import { PrismaSearchRepository } from './prisma-search.repository.js';
import { SearchController } from './search.controller.js';
import { SearchRepository } from './search.repository.js';
import { SearchService } from './search.service.js';

@Module({
  imports: [BoardModule],
  controllers: [SearchController],
  providers: [
    { provide: SearchRepository, useClass: PrismaSearchRepository },
    {
      provide: SearchService,
      useFactory: (...dependencies: ConstructorParameters<typeof SearchService>) =>
        new SearchService(...dependencies),
      inject: [SearchRepository, BoardAccessService],
    },
  ],
})
export class SearchModule {}
