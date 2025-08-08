import { Device, DeviceRegistrationLog } from '../../domain/device.model';

export interface IDatabaseService {
  // Device operations
  saveDevice(device: Device): Promise<void>;
  getDeviceByHardwareId(hardwareId: string, tenantId: string): Promise<Device | null>;
  getDeviceById(deviceId: string): Promise<Device | null>;
  updateDeviceStatus(deviceId: string, status: string, additionalData?: Partial<Device>): Promise<void>;
  getPendingDevices(): Promise<Device[]>;
  
  // Logging operations
  saveRegistrationLog(log: DeviceRegistrationLog): Promise<void>;
  getRegistrationLogs(hardwareId: string, tenantId: string): Promise<DeviceRegistrationLog[]>;
}