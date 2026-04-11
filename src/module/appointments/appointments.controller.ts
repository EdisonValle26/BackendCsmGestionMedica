import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/Guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { CreateAppointmentDto } from 'src/dto/create-appointment.dto';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Post()
  create(@Body() dto: CreateAppointmentDto, @User('sub') userId: number) {
    return this.appointmentsService.create(dto, userId);
  }

  @Get()
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CreateAppointmentDto,
    @User('sub') userId: number
  ) {
    return this.appointmentsService.update(
      Number(id), dto, userId);
  }
}
