import { Module } from '@nestjs/common';
import { SQSService } from './sqs.service';

@Module({
  providers: [
    {
      provide: 'IMessagingService',
      useClass: SQSService,
    },
  ],
  exports: ['IMessagingService'],
})
export class MessagingModule {}