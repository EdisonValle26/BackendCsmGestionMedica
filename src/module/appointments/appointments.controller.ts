import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateAppointmentDto } from 'src/dto/create-appointment.dto';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    const userId = 1;
    return this.appointmentsService.create(dto, userId);
  }

  @Get()
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    const userId = 1;
    return this.appointmentsService.cancel(Number(id), userId);
  }
}
