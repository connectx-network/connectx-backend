import { User } from '@prisma/client';

export type UserClaims = Pick<User, 'id' | 'email' | 'userRole'>;

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  ALL = 'ALL',
}
