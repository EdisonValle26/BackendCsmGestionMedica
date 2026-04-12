import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppointmentsModule } from './module/appointments/appointments.module';
import { AuthModule } from './module/auth/auth.module';
import { CatalogsModule } from './module/catalogs/catalogs.module';
import { ChatbotModule } from './module/chatbot/chatbot.module';
import { DoctorsModule } from './module/doctors/doctors.module';
import { MedicalRecordsModule } from './module/medical-records/medical-records.module';
import { OptionsModule } from './module/options/options.module';
import { PatientsModule } from './module/patients/patients.module';
import { RoleOptionPermissionsModule } from './module/role-option-permissions/role-option-permissions.module';
import { RolesModule } from './module/roles/roles.module';
import { UsersModule } from './module/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true ,
      envFilePath: `.env`,
    }),
    PrismaModule,
    AppointmentsModule,
    AuthModule,
    CatalogsModule,
    ChatbotModule,
    DoctorsModule,
    MedicalRecordsModule,
    PatientsModule,
    RolesModule,
    UsersModule,
    RoleOptionPermissionsModule,
    OptionsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
