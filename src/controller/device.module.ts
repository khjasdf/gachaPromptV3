import { Module } from '@nestjs/common';
import { DeviceController } from './device.controller';
import { DeviceService } from '../service/device.service';
import { DatabaseModule } from '../interface/db/database.module';
import { MessagingModule } from '../interface/messaging/messaging.module';

@Module({
  imports: [DatabaseModule, MessagingModule],
  controllers: [DeviceController],
  providers: [DeviceService],
})
export class DeviceModule {}