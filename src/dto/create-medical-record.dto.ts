import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMedicalRecordDto {

    @IsNumber()
    appointment_id!: number;

    @IsNumber()
    disease_id!: number;

    @IsString()
    diagnosis!: string;

    @IsString()
    treatment!: string;

    @IsString()
    @IsOptional()
    observations?: string;
}