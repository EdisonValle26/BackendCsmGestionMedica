import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/Guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/Guards/roles.guard';
import { CreateDoctorScheduleDto } from 'src/dto/create-doctor-schedule.dto';
import { DoctorScheduleService } from './doctor_schedule.service';

@Controller('doctor-schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class DoctorScheduleController {

  constructor(private readonly service: DoctorScheduleService) { }

  @Post()
  create(
    @Body() dto: CreateDoctorScheduleDto,
    @User('sub') userId: number,
  ) {
    return this.service.create(dto, userId);
  }

  @Get(':doctorId')
  findByDoctor(
    @Param('doctorId') doctorId: string,
  ) {
    return this.service.findByDoctor(Number(doctorId));
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @User('sub') userId: number,
  ) {
    return this.service.delete(Number(id), userId);
  }
}