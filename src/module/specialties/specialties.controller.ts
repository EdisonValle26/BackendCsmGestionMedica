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
import { SpecialtiesService } from './specialties.service';

@Controller('specialties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SpecialtiesController {

  constructor(private readonly service: SpecialtiesService) { }

  @Post()
  create(
    @Body('name') name: string,
    @User('sub') userId: number,
  ) {
    return this.service.create(name, userId);
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
    @Body('name') name: string,
    @User('sub') userId: number,
  ) {
    return this.service.update(Number(id), name, userId);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @User('sub') userId: number,
  ) {
    return this.service.delete(Number(id), userId);
  }
}