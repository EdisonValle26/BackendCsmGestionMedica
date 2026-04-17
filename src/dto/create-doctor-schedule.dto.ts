import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class CreateDoctorScheduleDto {

    @IsNumber()
    @IsNotEmpty()
    doctor_id!: number;

    @IsNumber()
    @Min(0)
    @Max(6)
    day_of_week!: number;

    @IsNotEmpty()
    start_time!: string; // "08:00"

    @IsNotEmpty()
    end_time!: string; // "12:00"

    @IsNumber()
    @Min(5)
    slot_duration!: number;
}