import { Module } from '@nestjs/common';
import { RoleOptionPermissionsService } from './role-option-permissions.service';
import { RoleOptionPermissionsController } from './role-option-permissions.controller';

@Module({
  controllers: [RoleOptionPermissionsController],
  providers: [RoleOptionPermissionsService],
})
export class RoleOptionPermissionsModule {}
