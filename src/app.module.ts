import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppointmentsModule } from './module/appointments/appointments.module';
import { AuthModule } from './module/auth/auth.module';
import { CatalogsModule } from './module/catalogs/catalogs.module';
import { ChatbotModule } from './module/chatbot/chatbot.module';
import { DoctorsModule } from './module/doctors/doctors.module';
import { MedicalRecordsModule } from './module/medical-records/medical-records.module';
import { PatientsModule } from './module/patients/patients.module';
import { PersonsModule } from './module/persons/persons.module';
import { ProfilesModule } from './module/profiles/profiles.module';
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
    PersonsModule,
    ProfilesModule,
    RolesModule,
    UsersModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
