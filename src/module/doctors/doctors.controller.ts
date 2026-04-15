import {
  Controller,
  Delete,
  Get,
  Param
} from '@nestjs/common';
import { User } from 'src/common/decorators/user.decorator';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {

  constructor(private readonly service: DoctorsService) { }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(Number(id));
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @User('sub') userId: number,
  ) {
    return this.service.delete(Number(id), userId);
  }
}