import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SessionInterceptor implements NestInterceptor {
    constructor(private prisma: PrismaService) { }

    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest();

        if (!req.user || !req.user.sub) {
            return next.handle();
        }

        const token = req.headers.authorization?.replace('Bearer ', '');

        const session = await this.prisma.user_sessions.findFirst({
            where: {
                user_id: req.user.sub,
                token: token,
                is_active: true,
            },
        });

        if (!session) {
            throw new UnauthorizedException('Sesión inválida');
        }

        if (!session.expires_at) {
            throw new UnauthorizedException('Sesión sin fecha de expiración');
        }

        if (session.expires_at < new Date()) {
            throw new UnauthorizedException('Sesión expirada');
        }
        return next.handle();
    }
}