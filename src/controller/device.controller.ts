import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Req,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { DeviceService } from '../service/device.service';
import { Public } from '../interface/auth/public.decorator';
import {
  DeviceRegistrationDto,
  DeviceRejectionDto,
} from '../domain/dto/device-registration.dto';
import {
  ApiResponseDto,
  DeviceStatusResponseDto,
  DeviceRegistrationResponseDto,
} from '../domain/dto/api-response.dto';

@ApiTags('devices')
@Controller('api/devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new device' })
  @ApiResponse({
    status: 201,
    description: 'Device registration request saved successfully',
    type: ApiResponseDto<DeviceRegistrationResponseDto>,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Device already registered' })
  async registerDevice(
    @Body() registrationDto: DeviceRegistrationDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<DeviceRegistrationResponseDto>> {
    try {
      const ipAddress = this.getClientIpAddress(req);
      return await this.deviceService.registerDevice(registrationDto, ipAddress);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Public()
  @Get('status/:hardwareId')
  @ApiOperation({ summary: 'Check device approval status' })
  @ApiParam({ name: 'hardwareId', description: 'Hardware ID of the device' })
  @ApiResponse({
    status: 200,
    description: 'Device status retrieved successfully',
    type: ApiResponseDto<DeviceStatusResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async getDeviceStatus(
    @Param('hardwareId') hardwareId: string,
    @Req() req: Request,
  ): Promise<ApiResponseDto<DeviceStatusResponseDto>> {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        throw new HttpException('tenantId query parameter is required', HttpStatus.BAD_REQUEST);
      }

      const ipAddress = this.getClientIpAddress(req);
      return await this.deviceService.getDeviceStatus(hardwareId, tenantId, ipAddress);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':deviceId/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a device registration' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiResponse({
    status: 200,
    description: 'Device approved successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @ApiResponse({ status: 400, description: 'Device is not in pending status' })
  async approveDevice(
    @Param('deviceId') deviceId: string,
  ): Promise<ApiResponseDto<{ sqsQueueUrl: string }>> {
    try {
      return await this.deviceService.approveDevice(deviceId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':deviceId/reject')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a device registration' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiResponse({
    status: 200,
    description: 'Device rejected successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @ApiResponse({ status: 400, description: 'Device is not in pending status' })
  async rejectDevice(
    @Param('deviceId') deviceId: string,
    @Body() rejectionDto: DeviceRejectionDto,
  ): Promise<ApiResponseDto> {
    try {
      return await this.deviceService.rejectDevice(deviceId, rejectionDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('pending')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending device registrations' })
  @ApiResponse({
    status: 200,
    description: 'Pending devices retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPendingDevices() {
    try {
      const devices = await this.deviceService.getPendingDevices();
      return {
        status: 'success',
        message: 'Pending devices retrieved successfully',
        data: devices,
      };
    } catch (error) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':deviceId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get device details by ID' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiResponse({
    status: 200,
    description: 'Device details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async getDeviceById(@Param('deviceId') deviceId: string) {
    try {
      const device = await this.deviceService.getDeviceById(deviceId);
      if (!device) {
        throw new HttpException('Device not found', HttpStatus.NOT_FOUND);
      }

      return {
        status: 'success',
        message: 'Device details retrieved successfully',
        data: device,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':hardwareId/logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get device registration logs' })
  @ApiParam({ name: 'hardwareId', description: 'Hardware ID of the device' })
  @ApiResponse({
    status: 200,
    description: 'Device logs retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDeviceLogs(
    @Param('hardwareId') hardwareId: string,
    @Req() req: Request,
  ) {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        throw new HttpException('tenantId query parameter is required', HttpStatus.BAD_REQUEST);
      }

      const logs = await this.deviceService.getRegistrationLogs(hardwareId, tenantId);
      return {
        status: 'success',
        message: 'Device logs retrieved successfully',
        data: logs,
      };
    } catch (error) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private getClientIpAddress(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    );
  }
}