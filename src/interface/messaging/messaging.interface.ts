export interface IMessagingService {
  createQueue(queueName: string): Promise<string>;
  sendMessage(queueUrl: string, message: any): Promise<void>;
  deleteQueue(queueUrl: string): Promise<void>;
}