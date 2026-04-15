import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/Guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { BaseDto } from 'src/dto/base.dto';
import { CreatePatientDto } from 'src/dto/create-patient.dto';
import { PatientsService } from './patients.service';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class PatientsController {

  constructor(private readonly service: PatientsService) { }

  @Post()
  create(@Body() dto: CreatePatientDto, @User('sub') userId: number) {
    return this.service.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: BaseDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(Number(id));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CreatePatientDto,
    @User('sub') userId: number,
  ) {
    return this.service.update(Number(id), dto, userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @User('sub') userId: number) {
    return this.service.delete(Number(id), userId);
  }
}