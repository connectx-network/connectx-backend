import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { parse, validate } from '@telegram-apps/init-data-node';
import { AuthService } from '../_modules_/auth/auth.service';

@Injectable()
export class TelegramMiniAppGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authToken = request.headers.authorization;

    const [authType, initDataRaw = ''] = (authToken || '').split(' ');

    if (!initDataRaw) {
      throw new Error('Missing initDataRaw in request body');
    }

    try {
      const publicKey = process.env.TELEGRAM_KEY;
      await validate(initDataRaw, publicKey);
      const res = parse(initDataRaw);
      const { user } = res;
      request.tmaUser = user
      return true;
    } catch (error) {
      console.error('Error verifying initDataRaw:', error);
      return false;
    }
  }
}
