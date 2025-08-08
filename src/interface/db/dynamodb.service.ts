import { Injectable } from '@nestjs/common';
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { IDatabaseService } from './database.interface';
import { Device, DeviceRegistrationLog, DeviceStatus } from '../../domain/device.model';

@Injectable()
export class DynamoDBService implements IDatabaseService {
  private dynamodb: DynamoDB.DocumentClient;
  private readonly devicesTable = process.env.DEVICES_TABLE || 'devices';
  private readonly logsTable = process.env.LOGS_TABLE || 'device-logs';

  constructor() {
    this.dynamodb = new DynamoDB.DocumentClient({
      region: process.env.AWS_REGION || 'ap-northeast-2',
    });
  }

  async saveDevice(device: Device): Promise<void> {
    const item = {
      PK: `TENANT#${device.tenantId}`,
      SK: `DEVICE#${device.hardwareId}`,
      GSI1PK: `STATUS#${device.status}`,
      GSI1SK: device.registeredAt.toISOString(),
      ...device,
    };

    await this.dynamodb.put({
      TableName: this.devicesTable,
      Item: item,
    }).promise();
  }

  async getDeviceByHardwareId(hardwareId: string, tenantId: string): Promise<Device | null> {
    const result = await this.dynamodb.get({
      TableName: this.devicesTable,
      Key: {
        PK: `TENANT#${tenantId}`,
        SK: `DEVICE#${hardwareId}`,
      },
    }).promise();

    return result.Item ? this.mapToDevice(result.Item) : null;
  }

  async getDeviceById(deviceId: string): Promise<Device | null> {
    const result = await this.dynamodb.scan({
      TableName: this.devicesTable,
      FilterExpression: 'deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': deviceId,
      },
    }).promise();

    return result.Items && result.Items.length > 0 
      ? this.mapToDevice(result.Items[0]) 
      : null;
  }

  async updateDeviceStatus(deviceId: string, status: string, additionalData?: Partial<Device>): Promise<void> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    const updateExpression = ['SET #status = :status, updatedAt = :updatedAt'];
    const expressionAttributeNames: any = { '#status': 'status' };
    const expressionAttributeValues: any = {
      ':status': status,
      ':updatedAt': new Date().toISOString(),
    };

    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        if (key !== 'status' && key !== 'updatedAt') {
          updateExpression.push(`${key} = :${key}`);
          expressionAttributeValues[`:${key}`] = additionalData[key];
        }
      });
    }

    await this.dynamodb.update({
      TableName: this.devicesTable,
      Key: {
        PK: `TENANT#${device.tenantId}`,
        SK: `DEVICE#${device.hardwareId}`,
      },
      UpdateExpression: updateExpression.join(', '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    }).promise();
  }

  async getPendingDevices(): Promise<Device[]> {
    const result = await this.dynamodb.query({
      TableName: this.devicesTable,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :status',
      ExpressionAttributeValues: {
        ':status': `STATUS#${DeviceStatus.PENDING}`,
      },
    }).promise();

    return result.Items ? result.Items.map(item => this.mapToDevice(item)) : [];
  }

  async saveRegistrationLog(log: DeviceRegistrationLog): Promise<void> {
    const item = {
      PK: `TENANT#${log.tenantId}`,
      SK: `LOG#${log.timestamp.toISOString()}#${log.logId}`,
      ...log,
    };

    await this.dynamodb.put({
      TableName: this.logsTable,
      Item: item,
    }).promise();
  }

  async getRegistrationLogs(hardwareId: string, tenantId: string): Promise<DeviceRegistrationLog[]> {
    const result = await this.dynamodb.query({
      TableName: this.logsTable,
      KeyConditionExpression: 'PK = :pk',
      FilterExpression: 'hardwareId = :hardwareId',
      ExpressionAttributeValues: {
        ':pk': `TENANT#${tenantId}`,
        ':hardwareId': hardwareId,
      },
      ScanIndexForward: false, // Latest first
    }).promise();

    return result.Items ? result.Items.map(item => this.mapToLog(item)) : [];
  }

  private mapToDevice(item: any): Device {
    return {
      deviceId: item.deviceId,
      hardwareId: item.hardwareId,
      tenantId: item.tenantId,
      ipAddress: item.ipAddress,
      systemInfo: item.systemInfo,
      status: item.status,
      sqsQueueUrl: item.sqsQueueUrl,
      registeredAt: new Date(item.registeredAt),
      updatedAt: new Date(item.updatedAt),
      approvedAt: item.approvedAt ? new Date(item.approvedAt) : undefined,
      rejectedAt: item.rejectedAt ? new Date(item.rejectedAt) : undefined,
      rejectionReason: item.rejectionReason,
    };
  }

  private mapToLog(item: any): DeviceRegistrationLog {
    return {
      logId: item.logId,
      hardwareId: item.hardwareId,
      tenantId: item.tenantId,
      action: item.action,
      ipAddress: item.ipAddress,
      timestamp: new Date(item.timestamp),
      details: item.details,
    };
  }
}