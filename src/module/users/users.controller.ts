import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/Guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { UpdateUserDto } from 'src/dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  createUser(
    @Body() dto: CreateUserDto,
    @User('sub') adminId: number,
  ) {
    return this.usersService.createUser(dto, adminId);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Put(':id')
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @User('sub') adminId: number
  ) {
    return this.usersService.updateUser(
      Number(id), dto, adminId);
  }

  @Delete(':id')
  deleteUser(
    @Param('id') id: string,
    @User('sub') adminId: number
  ) {
    return this.usersService.deleteUser(Number(id), adminId);
  }
}