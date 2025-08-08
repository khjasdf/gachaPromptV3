import { IsString, IsNotEmpty, IsIP, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SystemInfoDto {
  @ApiProperty({ example: 'linux', description: 'Operating system' })
  @IsString()
  @IsNotEmpty()
  os: string;

  @ApiProperty({ example: 'arm64', description: 'System architecture' })
  @IsString()
  @IsNotEmpty()
  arch: string;

  @ApiProperty({ example: 'xx:xx:xx:xx:xx:xx', description: 'MAC address' })
  @IsString()
  @IsNotEmpty()
  mac: string;
}

export class DeviceRegistrationDto {
  @ApiProperty({ example: 'HW001', description: 'Hardware ID of the device' })
  @IsString()
  @IsNotEmpty()
  hardwareId: string;

  @ApiProperty({ example: 'TENANT001', description: 'Tenant ID' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ example: '192.168.1.100', description: 'IP address of the device' })
  @IsIP()
  ipAddress: string;

  @ApiProperty({ type: SystemInfoDto, description: 'System information' })
  @ValidateNested()
  @Type(() => SystemInfoDto)
  systemInfo: SystemInfoDto;
}

export class DeviceApprovalDto {
  @ApiProperty({ example: 'https://sqs.ap-northeast-2.amazonaws.com/...', description: 'SQS Queue URL' })
  @IsString()
  @IsNotEmpty()
  sqsQueueUrl: string;
}

export class DeviceRejectionDto {
  @ApiProperty({ example: '이미 등록된 장치입니다', description: 'Rejection reason' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}