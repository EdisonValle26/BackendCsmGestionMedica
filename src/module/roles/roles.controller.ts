import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/Guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { CreateRolDto } from 'src/dto/create-rol.dto';
import { RolesService } from './roles.service';

@Controller('rol')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Post()
  create(
    @Body() dto: CreateRolDto,
    @User('sub') adminId: number,
  ) {
    return this.rolesService.create(dto, adminId);
  }

  @Get(':id')
  findId(
    @Param('id') id: string,
  ) {
    return this.rolesService.findById(Number(id))
  }

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CreateRolDto,
    @User('sub') adminId: number
  ) {
    return this.rolesService.update(
      Number(id), dto, adminId);
  }

  @Delete(':id')
  deleteUser(
    @Param('id') id: string,
    @User('sub') adminId: number
  ) {
    return this.rolesService.delete(Number(id), adminId);
  }
}
