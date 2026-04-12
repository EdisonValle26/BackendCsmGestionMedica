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
import { AssignRolePermissionDto } from 'src/dto/role-option-permissions.dto';
import { RoleOptionPermissionsService } from './role-option-permissions.service';

@Controller('role-option-permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class RoleOptionPermissionsController {
  constructor(private readonly roleOptionPermissionsService: RoleOptionPermissionsService) { }

  @Post()
  create(
    @Body() dto: AssignRolePermissionDto,
    @User('sub') userId: number,
  ) {
    return this.roleOptionPermissionsService.create(dto, userId);
  }


  @Get()
  findAll(@Query() query: BaseDto) {
    return this.roleOptionPermissionsService.findAll(query);
  }

  @Get(':roleId/:optionId')
  findById(
    @Param('roleId') roleId: string,
    @Param('optionId') optionId: string,
  ) {
    return this.roleOptionPermissionsService.findById(
      Number(roleId),
      Number(optionId),
    );
  }

  @Put()
  update(
    @Body() dto: AssignRolePermissionDto,
    @User('sub') userId: number,
  ) {
    return this.roleOptionPermissionsService.update(dto, userId);
  }

  @Delete(':roleId/:optionId')
  delete(
    @Param('roleId') roleId: string,
    @Param('optionId') optionId: string,
    @User('sub') userId: number
  ) {
    return this.roleOptionPermissionsService.delete(Number(roleId), Number(optionId), userId);
  }

}