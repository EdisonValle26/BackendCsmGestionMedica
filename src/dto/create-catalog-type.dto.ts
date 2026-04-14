import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCatalogTypeDto {

    @IsString()
    @IsNotEmpty()
    code!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;
}