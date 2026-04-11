import { Body, Controller, Post } from '@nestjs/common';
import { ChatbotMessageDto } from '../../dto/chatbot-message.dto';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) { }

  @Post('message')
  async sendMessage(@Body() dto: ChatbotMessageDto) {
    return this.chatbotService.processMessage(dto);
  }

  @Post('webhook')
  handleWhatsapp(@Body() dto: any) {
    return this.chatbotService.handleWhatsappWebhook(dto);
  }
}