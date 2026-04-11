import {
    IsNotEmpty,
    IsString
} from 'class-validator';

export class CreateRolDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    description!: string;
}