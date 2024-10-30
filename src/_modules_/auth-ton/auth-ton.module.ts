import { Module } from '@nestjs/common';
import { AuthTonService } from './auth-ton.service';
import { AuthTonController } from './auth-ton.controller';

@Module({
  controllers: [AuthTonController],
  providers: [AuthTonService],
})
export class AuthTonModule {}
