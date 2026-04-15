import {
    IsDateString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreatePatientDto {

    @IsString()
    @IsNotEmpty()
    identification!: string;

    @IsNumber()
    document_type_id!: number;

    @IsString()
    @IsNotEmpty()
    first_name!: string;

    @IsString()
    @IsNotEmpty()
    last_name!: string;

    @IsDateString()
    birth_date!: string;

    @IsNumber()
    gender_id!: number;

    @IsNumber()
    nationality_id!: number;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    address?: string;

    // paciente
    @IsString()
    @IsOptional()
    medical_history?: string;
}