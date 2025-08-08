import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DeviceModule } from './controller/device.module';
import { AuthModule } from './interface/auth/auth.module';
import { DatabaseModule } from './interface/db/database.module';
import { MessagingModule } from './interface/messaging/messaging.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    AuthModule,
    DatabaseModule,
    MessagingModule,
    DeviceModule,
  ],
})
export class AppModule {}