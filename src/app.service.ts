import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello ConnectX! 2024/08/08 - 14:56';
  }
}
