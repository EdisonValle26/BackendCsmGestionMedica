import {
    IsDateString,
    IsEmail,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    identification: string;

    @IsNumber()
    document_type_id: number;

    @IsString()
    @IsNotEmpty()
    first_name: string;

    @IsString()
    @IsNotEmpty()
    last_name: string;

    @IsDateString()
    birth_date: string;

    @IsNumber()
    gender_id: number;

    @IsNumber()
    nationality_id: number;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsEmail()
    email: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsNumber()
    role_id: number;
}