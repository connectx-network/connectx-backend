import { Module } from '@nestjs/common';
import { AuthSolanaService } from './auth-solana.service';
import { AuthSolanaController } from './auth-solana.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [AuthSolanaController],
  providers: [AuthSolanaService],
})
export class AuthSolanaModule {}
