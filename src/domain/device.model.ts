export interface SystemInfo {
  os: string;
  arch: string;
  mac: string;
}

export enum DeviceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface Device {
  deviceId: string;
  hardwareId: string;
  tenantId: string;
  ipAddress: string;
  systemInfo: SystemInfo;
  status: DeviceStatus;
  sqsQueueUrl?: string;
  registeredAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export interface DeviceRegistrationLog {
  logId: string;
  hardwareId: string;
  tenantId: string;
  action: 'register' | 'approve' | 'reject' | 'status_check';
  ipAddress: string;
  timestamp: Date;
  details?: any;
}