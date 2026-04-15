import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseDto } from 'src/dto/base.dto';
import { CreatePatientDto } from 'src/dto/create-patient.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PatientsService {

    constructor(private prisma: PrismaService) { }

    async create(dto: CreatePatientDto, userId: number) {

        const now = new Date();

        const existsPerson = await this.prisma.persons.findFirst({
            where: {
                identification: dto.identification,
                deleted_at: null,
            },
        });

        if (existsPerson) {
            throw new BadRequestException('La persona ya existe');
        }

        const person = await this.prisma.persons.create({
            data: {
                identification: dto.identification,
                document_type_id: dto.document_type_id,
                first_name: dto.first_name,
                last_name: dto.last_name,
                birth_date: new Date(dto.birth_date),
                gender_id: dto.gender_id,
                nationality_id: dto.nationality_id,
                phone: dto.phone,
                email: dto.email,
                address: dto.address,
                created_at: now,
                created_by: userId,
            },
        });

        const patient = await this.prisma.patients.create({
            data: {
                person_id: person.id,
                medical_history: dto.medical_history,
                created_at: now,
                created_by: userId,
            },
        });

        return {
            message: 'Paciente creado correctamente',
            patient,
        };
    }

    async update(id: number, dto: CreatePatientDto, userId: number) {

        const now = new Date();

        const patient = await this.prisma.patients.findUnique({
            where: { id },
            include: { persons: true },
        });

        if (!patient || patient.deleted_at) {
            throw new BadRequestException('Paciente no existe');
        }

        const exists = await this.prisma.persons.findFirst({
            where: {
                identification: dto.identification,
                id: { not: patient.person_id! },
                deleted_at: null,
            },
        });

        if (exists) {
            throw new BadRequestException('Identificación ya registrada');
        }

        await this.prisma.persons.update({
            where: { id: patient.person_id! },
            data: {
                identification: dto.identification,
                document_type_id: dto.document_type_id,
                first_name: dto.first_name,
                last_name: dto.last_name,
                birth_date: new Date(dto.birth_date),
                gender_id: dto.gender_id,
                nationality_id: dto.nationality_id,
                phone: dto.phone,
                email: dto.email,
                address: dto.address,
                updated_at: now,
                updated_by: userId,
            },
        });

        const updated = await this.prisma.patients.update({
            where: { id },
            data: {
                medical_history: dto.medical_history,
                updated_at: now,
                updated_by: userId,
            },
        });

        return {
            message: 'Paciente actualizado correctamente',
            updated,
        };
    }

    async findAll(query: BaseDto) {

        let page = Number(query.skip) || 1;
        let limit = Number(query.take) || 10;

        let where: any = {
            deleted_at: query.status === 'I' ? { not: null } : null,
        };

        if (query.field && query.value_field) {
            where.persons = {
                OR: [
                    {
                        first_name: {
                            contains: query.value_field,
                            mode: 'insensitive',
                        },
                    },
                    {
                        last_name: {
                            contains: query.value_field,
                            mode: 'insensitive',
                        },
                    },
                    {
                        identification: {
                            contains: query.value_field,
                            mode: 'insensitive',
                        },
                    },
                ],
            };
        }

        const total = await this.prisma.patients.count({ where });

        const skip = (page - 1) * limit;

        const data = await this.prisma.patients.findMany({
            where,
            skip,
            take: limit,
            include: {
                persons: true,
            },
            orderBy: { id: 'desc' },
        });

        return {
            data,
            total,
            page,
            limit,
        };
    }

    async findById(id: number) {

        const patient = await this.prisma.patients.findUnique({
            where: { id },
            include: { persons: true },
        });

        if (!patient || patient.deleted_at) {
            throw new BadRequestException('Paciente no existe');
        }

        return patient;
    }

    async delete(id: number, userId: number) {

        const now = new Date();

        const patient = await this.prisma.patients.findUnique({
            where: { id },
        });

        if (!patient) {
            throw new BadRequestException('Paciente no existe');
        }

        const isDeleting = patient.deleted_at === null;

        await this.prisma.patients.update({
            where: { id },
            data: {
                deleted_at: isDeleting ? now : null,
                updated_at: now,
                updated_by: userId,
            },
        });

        return {
            message: isDeleting
                ? 'Paciente desactivado'
                : 'Paciente reactivado',
        };
    }
}