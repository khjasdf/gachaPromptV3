import { Module } from '@nestjs/common';
import { DynamoDBService } from './dynamodb.service';

@Module({
  providers: [
    {
      provide: 'IDatabaseService',
      useClass: DynamoDBService,
    },
  ],
  exports: ['IDatabaseService'],
})
export class DatabaseModule {}