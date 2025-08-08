import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: 'success' | 'error';

  @ApiProperty({ example: '요청이 성공적으로 처리되었습니다', description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data?: T;
}

export class DeviceStatusResponseDto {
  @ApiProperty({ example: 'pending', description: 'Device status' })
  status?: string;

  @ApiProperty({ example: 'generated-id', description: 'Device ID' })
  deviceId?: string;

  @ApiProperty({ example: 'https://sqs.ap-northeast-2.amazonaws.com/...', description: 'SQS Queue URL' })
  sqsQueueUrl?: string;
}

export class DeviceRegistrationResponseDto {
  @ApiProperty({ example: 'pending', description: 'Registration status' })
  status: string;
}