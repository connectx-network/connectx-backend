import { Module } from '@nestjs/common';
import { UserConnectionService } from './user-connection.service';
import { UserConnectionController } from './user-connection.controller';

@Module({
  controllers: [UserConnectionController],
  providers: [UserConnectionService],
})
export class UserConnectionModule {}
