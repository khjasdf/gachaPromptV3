import { Injectable, Inject, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IDatabaseService } from '../interface/db/database.interface';
import { IMessagingService } from '../interface/messaging/messaging.interface';
import { Device, DeviceStatus, DeviceRegistrationLog } from '../domain/device.model';
import { DeviceRegistrationDto, DeviceRejectionDto } from '../domain/dto/device-registration.dto';
import { ApiResponseDto, DeviceStatusResponseDto, DeviceRegistrationResponseDto } from '../domain/dto/api-response.dto';

@Injectable()
export class DeviceService {
  constructor(
    @Inject('IDatabaseService') private readonly databaseService: IDatabaseService,
    @Inject('IMessagingService') private readonly messagingService: IMessagingService,
  ) {}

  async registerDevice(
    registrationDto: DeviceRegistrationDto,
    ipAddress: string,
  ): Promise<ApiResponseDto<DeviceRegistrationResponseDto>> {
    const { hardwareId, tenantId } = registrationDto;

    // Check for duplicate registration
    const existingDevice = await this.databaseService.getDeviceByHardwareId(hardwareId, tenantId);
    if (existingDevice) {
      throw new ConflictException('Device already registered');
    }

    // Create new device
    const device: Device = {
      deviceId: uuidv4(),
      hardwareId,
      tenantId,
      ipAddress,
      systemInfo: registrationDto.systemInfo,
      status: DeviceStatus.PENDING,
      registeredAt: new Date(),
      updatedAt: new Date(),
    };

    // Save device
    await this.databaseService.saveDevice(device);

    // Log registration
    await this.logDeviceAction(device, 'register', ipAddress);

    return {
      status: 'success',
      message: '등록 요청이 저장되었습니다',
      data: { status: 'pending' },
    };
  }

  async getDeviceStatus(hardwareId: string, tenantId: string, ipAddress: string): Promise<ApiResponseDto<DeviceStatusResponseDto>> {
    const device = await this.databaseService.getDeviceByHardwareId(hardwareId, tenantId);
    
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Log status check
    await this.logDeviceAction(device, 'status_check', ipAddress);

    if (device.status === DeviceStatus.APPROVED) {
      return {
        status: 'success',
        message: '승인 완료',
        data: {
          deviceId: device.deviceId,
          sqsQueueUrl: device.sqsQueueUrl,
        },
      };
    }

    return {
      status: 'success',
      message: '승인 대기 중',
      data: { status: 'pending' },
    };
  }

  async approveDevice(deviceId: string): Promise<ApiResponseDto<{ sqsQueueUrl: string }>> {
    const device = await this.databaseService.getDeviceById(deviceId);
    
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.status !== DeviceStatus.PENDING) {
      throw new BadRequestException('Device is not in pending status');
    }

    // Create SQS queue for the device
    const queueName = `device-${device.hardwareId}-${device.tenantId}`;
    const sqsQueueUrl = await this.messagingService.createQueue(queueName);

    // Update device status
    await this.databaseService.updateDeviceStatus(deviceId, DeviceStatus.APPROVED, {
      sqsQueueUrl,
      approvedAt: new Date(),
    });

    // Log approval
    await this.logDeviceAction(device, 'approve', device.ipAddress, { sqsQueueUrl });

    return {
      status: 'success',
      message: '장치가 승인되었습니다',
      data: { sqsQueueUrl },
    };
  }

  async rejectDevice(deviceId: string, rejectionDto: DeviceRejectionDto): Promise<ApiResponseDto> {
    const device = await this.databaseService.getDeviceById(deviceId);
    
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.status !== DeviceStatus.PENDING) {
      throw new BadRequestException('Device is not in pending status');
    }

    // Update device status
    await this.databaseService.updateDeviceStatus(deviceId, DeviceStatus.REJECTED, {
      rejectedAt: new Date(),
      rejectionReason: rejectionDto.reason,
    });

    // Log rejection
    await this.logDeviceAction(device, 'reject', device.ipAddress, { reason: rejectionDto.reason });

    return {
      status: 'success',
      message: '장치가 거부되었습니다',
    };
  }

  async getPendingDevices(): Promise<Device[]> {
    return this.databaseService.getPendingDevices();
  }

  async getDeviceById(deviceId: string): Promise<Device | null> {
    return this.databaseService.getDeviceById(deviceId);
  }

  async getRegistrationLogs(hardwareId: string, tenantId: string): Promise<DeviceRegistrationLog[]> {
    return this.databaseService.getRegistrationLogs(hardwareId, tenantId);
  }

  private async logDeviceAction(
    device: Device,
    action: 'register' | 'approve' | 'reject' | 'status_check',
    ipAddress: string,
    details?: any,
  ): Promise<void> {
    const log: DeviceRegistrationLog = {
      logId: uuidv4(),
      hardwareId: device.hardwareId,
      tenantId: device.tenantId,
      action,
      ipAddress,
      timestamp: new Date(),
      details,
    };

    await this.databaseService.saveRegistrationLog(log);
  }
}