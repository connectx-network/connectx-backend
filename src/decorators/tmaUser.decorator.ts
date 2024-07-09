import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserClaims } from '../types/auth.type';

export const TmaUser = createParamDecorator(
    (data: keyof UserClaims, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.tmaUser;
        return data ? user?.[data] : user;
    },
);
