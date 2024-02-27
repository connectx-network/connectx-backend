import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from "@prisma/client";

@Injectable()
export class UserTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data : User) => {
        if (!data) {
          return {};
        }
        const { password, ...transformUser } = data

        return transformUser
      }),
    );
  }
}
