import { IsDateString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateDoctorScheduleDto {

    @IsNumber()
    @IsNotEmpty()
    doctor_id!: number;

    @IsDateString()
    @IsNotEmpty()
    schedule_date!: string;

    @IsNotEmpty()
    start_time!: string; // "08:00"

    @IsNotEmpty()
    end_time!: string; // "12:00"

    @IsNumber()
    @Min(5)
    slot_duration!: number;
}