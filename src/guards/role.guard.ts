import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserClaims } from '../types/auth.type';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        // get the roles required
        const role = this.reflector.get<string>('role', context.getHandler());
        if (!role) {
            return false;
        }

        if (role === 'ALL') return true;

        const request = context.switchToHttp().getRequest();
        const user: UserClaims = request.user;
        return role === user.userRole;
    }
}
