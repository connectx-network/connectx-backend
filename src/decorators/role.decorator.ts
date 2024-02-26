import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { Role } from '../types/auth.type';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/role.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

export const Roles = (role: Role) =>
    applyDecorators(
        ApiBearerAuth(),
        UseGuards(JwtAuthGuard, RolesGuard),
        SetMetadata('role', role),
    );
