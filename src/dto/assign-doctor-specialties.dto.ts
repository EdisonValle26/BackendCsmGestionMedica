import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class AssignDoctorSpecialtiesDto {

    @IsNumber()
    @IsNotEmpty()
    doctor_id!: number;

    @IsArray()
    @ArrayNotEmpty()
    specialty_ids!: number[];
}