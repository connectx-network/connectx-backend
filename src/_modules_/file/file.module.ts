import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import {S3Module} from "../s3/s3.module";

@Module({
  imports: [FirebaseModule, S3Module],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
