import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/Guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { BaseDto } from 'src/dto/base.dto';
import { CreateOptionDto } from 'src/dto/create-option.dto';
import { OptionsService } from './options.service';

@Controller('options')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class OptionsController {
  constructor(private readonly service: OptionsService) { }

  @Post()
  create(
    @Body() dto: CreateOptionDto,
    @User('sub') userId: number,
  ) {
    return this.service.create(dto, userId);
  }

  @Get(':id')
  findId(@Param('id') id: string) {
    return this.service.findById(Number(id));
  }

  @Get()
  findAll(@Query() query: BaseDto) {
    return this.service.findAll(query);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CreateOptionDto,
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