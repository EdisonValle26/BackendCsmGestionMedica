import { Module } from '@nestjs/common';
import { DoctorScheduleService } from './doctor_schedule.service';
import { DoctorScheduleController } from './doctor_schedule.controller';

@Module({
  controllers: [DoctorScheduleController],
  providers: [DoctorScheduleService],
})
export class DoctorScheduleModule {}
