import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';

@Module({
  imports: [],
  providers: [],
  controllers: [CatsController],
})
export class CatsModule {}
