import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/common/Guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

import { CreateCatalogTypeDto } from 'src/dto/create-catalog-type.dto';
import { CatalogTypeService } from './catalog-type.service';

@Controller('catalog-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CatalogTypeController {

  constructor(private readonly service: CatalogTypeService) { }

  @Post()
  create(
    @Body() dto: CreateCatalogTypeDto,
  ) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(Number(id));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CreateCatalogTypeDto,
  ) {
    return this.service.update(Number(id), dto);
  }

}