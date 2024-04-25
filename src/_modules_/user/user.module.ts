import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { FileModule } from '../file/file.module';
import { BullModule } from '@nestjs/bull';
import { Queues } from '../../types/queue.type';

@Module({
  imports: [
    FileModule,
    BullModule.registerQueue({
      name: Queues.mail,
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
