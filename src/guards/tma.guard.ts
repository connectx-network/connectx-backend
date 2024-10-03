import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { parse, validate } from '@telegram-apps/init-data-node';

@Injectable()
export class TelegramMiniAppGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authToken = request.headers.authorization;

    const [authType, initDataRaw = ''] = (authToken || '').split(' ');

    if (!initDataRaw) {
      throw new UnauthorizedException('Missing initDataRaw in request body');
    }

    try {
      const publicKey = process.env.TELEGRAM_KEY;
      await validate(initDataRaw, publicKey);
      const res = parse(initDataRaw);
      const { user } = res;
      request.tmaUser = user;
      return true;
    } catch (error) {
      console.error('Error verifying initDataRaw:', error);
      return false;
    }
  }
}
