import { Injectable } from '@nestjs/common';
import { SQS } from 'aws-sdk';
import { IMessagingService } from './messaging.interface';

@Injectable()
export class SQSService implements IMessagingService {
  private sqs: SQS;

  constructor() {
    this.sqs = new SQS({
      region: process.env.AWS_REGION || 'ap-northeast-2',
    });
  }

  async createQueue(queueName: string): Promise<string> {
    const params = {
      QueueName: queueName,
      Attributes: {
        MessageRetentionPeriod: '1209600', // 14 days
        VisibilityTimeoutSeconds: '30',
      },
    };

    const result = await this.sqs.createQueue(params).promise();
    return result.QueueUrl!;
  }

  async sendMessage(queueUrl: string, message: any): Promise<void> {
    const params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    };

    await this.sqs.sendMessage(params).promise();
  }

  async deleteQueue(queueUrl: string): Promise<void> {
    await this.sqs.deleteQueue({ QueueUrl: queueUrl }).promise();
  }
}