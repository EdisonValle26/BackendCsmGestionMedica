import { IsOptional, IsString } from 'class-validator';

export class ChatbotMessageDto {
    @IsString()
    message: string | undefined;

    @IsOptional()
    @IsString()
    session_id?: string;
}