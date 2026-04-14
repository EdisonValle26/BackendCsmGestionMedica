import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/common/Guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';

import { BaseDto } from 'src/dto/base.dto';
import { CreateCatalogDto } from 'src/dto/create-catalog.dto';
import { CatalogsService } from './catalogs.service';

@Controller('catalogs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CatalogsController {

  constructor(private readonly service: CatalogsService) { }

  @Post()
  create(
    @Body() dto: CreateCatalogDto,
    @User('sub') userId: number,
  ) {
    return this.service.create(dto, userId);
  }

  @Get('group')
  findGroup(@Query('codes') codes: string) {
    return this.service.findGroup(codes.split(','));
  }

  @Get('type/:code')
  findByType(@Param('code') code: string) {
    return this.service.findByTypeCode(code);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(Number(id));
  }

  @Get()
  findAll(@Query() query: BaseDto) {
    return this.service.findAll(query);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CreateCatalogDto,
    @User('sub') userId: number,
  ) {
    return this.service.update(Number(id), dto, userId);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @User('sub') userId: number,
  ) {
    return this.service.delete(Number(id), userId);
  }

}