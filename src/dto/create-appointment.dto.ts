import {
    IsDateString,
    IsNumber,
    IsOptional,
    IsString
} from 'class-validator';

export class CreateAppointmentDto {
    @IsNumber()
    patient_id!: number;

    @IsNumber()
    doctor_id!: number;

    @IsNumber()
    specialty_id!: number;

    @IsDateString()
    appointment_date!: string;

    @IsString()
    appointment_time!: string;

    @IsNumber()
    duration_minutes!: number;

    @IsNumber()
    appointment_type_id!: number;

    @IsNumber()
    appointment_status_id!: number;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}