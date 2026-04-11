import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request) => {
                    const authHeader = request?.headers?.authorization;
                    if (!authHeader) return null;

                    return authHeader;
                },
            ]),
            secretOrKey: process.env.JWT_SECRET,
        });
    }

    async validate(payload: { sub: number; username: string }) {
        const user = await this.prisma.users.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no existe');
        }

        if (!user.is_active) {
            throw new UnauthorizedException('Usuario inactivo');
        }

        if (user.is_locked) {
            throw new UnauthorizedException('Usuario bloqueado');
        }

        return {
            sub: user.id,
            username: user.username,
        };
    }
}