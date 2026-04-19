import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/Guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { BaseDto } from 'src/dto/base.dto';
import { CreateAppointmentDto } from 'src/dto/create-appointment.dto';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AppointmentsController {

  constructor(private readonly service: AppointmentsService) { }

  @Post()
  create(
    @Body() dto: CreateAppointmentDto,
    @User('sub') userId: number
  ) {
    return this.service.create(dto, userId);
  }

  @Get('available-slots')
  getAvailable(
    @Query('doctor_id') doctorId: string,
    @Query('date') date: string
  ) {
    return this.service.getAvailableSlots(Number(doctorId), date);
  }

  @Get(':id')
  findById(
    @Param('id') id: string
  ) {
    return this.service.findById(Number(id));
  }

  @Get()
  findAll(@Query() query: BaseDto) {
    return this.service.findAll(query);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CreateAppointmentDto,
    @User('sub') userId: number
  ) {
    return this.service.update(Number(id), dto, userId);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @User('sub') userId: number
  ) {
    return this.service.delete(Number(id), userId);
  }

}
