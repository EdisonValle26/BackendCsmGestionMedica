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

        const sessionDb = await this.prisma.chatbot_sessions.findUnique({
            where: { session_id: sessionId }
        });

        if (!sessionDb) return;

        await this.prisma.chatbot_sessions.update({
            where: { id: sessionDb.id },
            data: {
                intent_id: session.intent_id,
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
                intent_id: null,
                step: null,
                data: {},
                patient_id: null,
            },
        });
    }
}