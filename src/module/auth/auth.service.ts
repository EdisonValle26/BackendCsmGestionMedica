import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    // LOGIN
    async login(dto: any, req: any) {
        const user = await this.prisma.users.findUnique({
            where: { username: dto.username },
            include: {
                user_roles: {
                    include: {
                        roles: true,
                    },
                },
            },
        });

        const registerAttempt = async (success: boolean) => {
            await this.prisma.login_attempts.create({
                data: {
                    username: dto.username,
                    ip_address: req.ip,
                    success,
                    attempt_time: new Date(),
                },
            });
        };

        if (user?.password === null) {
            throw new BadRequestException('Debe ingresar la contraseña');
        }

        if (!user) {
            await registerAttempt(false);
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!user.is_active) {
            throw new UnauthorizedException('Usuario inactivo');
        }

        if (user.is_locked) {
            throw new UnauthorizedException('Usuario bloqueado');
        }

        const passwordValid = await bcrypt.compare(dto.password, user.password);

        if (!passwordValid) {
            await registerAttempt(false);

            const attempts = user.failed_attempts! + 1;

            await this.prisma.users.update({
                where: { id: user.id },
                data: {
                    failed_attempts: attempts,
                    is_locked: attempts >= 5,
                },
            });

            throw new UnauthorizedException('Credenciales inválidas');
        }

        // éxito
        await registerAttempt(true);

        await this.prisma.users.update({
            where: { id: user.id },
            data: {
                failed_attempts: 0,
                last_login: new Date(),
            },
        });

        // roles del usuario
        const roles = user.user_roles.map((r) => r.roles?.name);

        const payload = {
            sub: user.id,
            username: user.username,
            roles,
        };

        const token = this.jwtService.sign(payload);

        await this.prisma.user_sessions.create({
            data: {
                user_id: user.id,
                token,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                expires_at: new Date(Date.now() + 1000 * 60 * 60 * 8),
            },
        });

        return {
            access_token: token,
            user: {
                id: user.id,
                username: user.username,
                roles,
            },
        };
    }

    async changePassword(userId: number, dto: any) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        const isValid = await bcrypt.compare(
            dto.currentPassword,
            user.password!,
        );

        if (!isValid) {
            throw new BadRequestException('Contraseña actual incorrecta');
        }

        const newPassword = await bcrypt.hash(dto.newPassword, 10);

        await this.prisma.users.update({
            where: { id: userId },
            data: {
                password: newPassword,
            },
        });

        return { message: 'Contraseña actualizada correctamente' };
    }

    async requestPasswordReset(username: string) {
        const user = await this.prisma.users.findUnique({
            where: { username },
        });

        if (!user) return;

        const token = Math.random().toString(36).substring(2);

        await this.prisma.password_resets.create({
            data: {
                user_id: user.id,
                token,
                expires_at: new Date(Date.now() + 1000 * 60 * 30), // 30 min
            },
        });

        // luego enviar email
        return { message: 'Token generado' };
    }

    async resetPassword(dto: any) {
        const reset = await this.prisma.password_resets.findFirst({
            where: {
                token: dto.token,
                used: false,
            },
        });

        if (!reset) {
            throw new BadRequestException('Token inválido');
        }

        if (!reset.expires_at) {
            throw new UnauthorizedException('Token sin fecha de expiración');
        }


        if (new Date(reset.expires_at) < new Date()) {
            throw new BadRequestException('Token expirado');
        }

        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

        await this.prisma.users.update({
            where: { id: reset.user_id! },
            data: {
                password: hashedPassword,
            },
        });

        await this.prisma.password_resets.update({
            where: { id: reset.id },
            data: {
                used: true,
            },
        });

        return { message: 'Contraseña restablecida correctamente' };
    }
}