import { IsString, MaxLength } from "class-validator";

export class ChangePasswordDto {

    @IsString()
    currentPassword: string;

    @IsString()
    @MaxLength(20)
    newPassword: string;
}