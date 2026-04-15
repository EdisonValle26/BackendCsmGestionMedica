import {
    IsDateString,
    IsEmail,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    first_name?: string;

    @IsString()
    @IsOptional()
    last_name?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsDateString()
    @IsOptional()
    birth_date?: string;

    @IsNumber()
    @IsOptional()
    gender_id?: number;

    @IsNumber()
    @IsOptional()
    nationality_id?: number;

    @IsString()
    @IsOptional()
    license_number?: string;
}