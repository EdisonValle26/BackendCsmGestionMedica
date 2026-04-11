import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ChatbotActionsService } from './services/chatbot-actions.service';
import { ChatbotAiService } from './services/chatbot-ai.service';
import { ChatbotFlowService } from './services/chatbot-flow.service';
import { ChatbotSessionService } from './services/chatbot-session.service';

@Module({
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    ChatbotAiService,
    ChatbotActionsService,
    ChatbotFlowService,
    ChatbotSessionService
  ],
})
export class ChatbotModule { }