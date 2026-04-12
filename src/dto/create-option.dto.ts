import { Type } from 'class-transformer';
import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested
} from 'class-validator';

export class CreateOptionDto {

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    route!: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsNumber()
    @IsOptional()
    parent_id?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOptionDto)
    @IsOptional()
    children?: CreateOptionDto[];
}