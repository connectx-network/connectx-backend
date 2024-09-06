import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello ConnectX! 2024/09/06 - 12:20';
  }
}
