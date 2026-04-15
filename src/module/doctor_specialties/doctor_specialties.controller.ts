import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/Guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { AssignDoctorSpecialtiesDto } from 'src/dto/assign-doctor-specialties.dto';
import { BaseDto } from 'src/dto/base.dto';
import { DoctorSpecialtiesService } from './doctor_specialties.service';

@Controller('doctor-specialties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class DoctorSpecialtiesController {

  constructor(private readonly service: DoctorSpecialtiesService) { }

  @Post()
  assign(
    @Body() dto: AssignDoctorSpecialtiesDto,
    @User('sub') userId: number,
  ) {
    return this.service.assign(dto, userId);
  }

  @Get()
  findAll(@Query() query: BaseDto) {
    return this.service.findAll(query);
  }

}