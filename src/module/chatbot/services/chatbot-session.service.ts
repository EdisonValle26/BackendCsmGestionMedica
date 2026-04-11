import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ChatbotSessionService {
    constructor(private prisma: PrismaService) { }

    async getSession(sessionId: string) {
        let session = await this.prisma.chatbot_sessions.findFirst({
            where: { session_id: sessionId },
        });

        if (!session) {
            session = await this.prisma.chatbot_sessions.create({
                data: {
                    session_id: sessionId,
                    data: {},
                    created_at: new Date(),
                },
            });
        }

        return session;
    }

    async updateSession(sessionId: string, session: any) {
        await this.prisma.chatbot_sessions.updateMany({
            where: { session_id: sessionId },
            data: {
                intent: session.intent,
                step: session.step,
                data: session.data,
                patient_id: session.patient_id,
                updated_at: new Date(),
            },
        });
    }

    async clearSession(sessionId: string) {
        await this.prisma.chatbot_sessions.updateMany({
            where: { session_id: sessionId },
            data: {
                intent: null,
                step: null,
                data: {},
                patient_id: null,
            },
        });
    }
}