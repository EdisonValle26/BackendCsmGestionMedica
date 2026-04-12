import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class AssignRolePermissionDto {

    @IsNumber()
    @IsNotEmpty()
    role_id!: number;

    @IsNumber()
    @IsNotEmpty()
    option_id!: number;

    @IsArray()
    @ArrayNotEmpty()
    permissions!: number[];
}