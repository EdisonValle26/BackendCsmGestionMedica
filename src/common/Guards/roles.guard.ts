import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private prisma: PrismaService,
        private reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.get<string[]>(
            'roles',
            context.getHandler(),
        );

        if (!requiredRoles) return true;

        const req = context.switchToHttp().getRequest();
        const user = req.user;

        const roles = await this.prisma.user_roles.findMany({
            where: { user_id: user.sub },
            include: {
                roles: true,
            },
        });

        const hasRole = roles.some((r) =>
            requiredRoles.includes(r.roles?.name!),
        );

        if (!hasRole) {
            throw new ForbiddenException('No autorizado');
        }

        return true;
    }
}