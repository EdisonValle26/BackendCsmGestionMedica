import { Module } from '@nestjs/common';
import { CatalogTypeService } from './catalog-type.service';
import { CatalogTypeController } from './catalog-type.controller';

@Module({
  controllers: [CatalogTypeController],
  providers: [CatalogTypeService],
})
export class CatalogTypeModule {}
