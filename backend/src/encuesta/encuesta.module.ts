import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EncuestaController } from './encuesta.controller';
import { EncuestaService } from './encuesta.service';

@Module({
  imports: [DatabaseModule],
  controllers: [EncuestaController],
  providers: [EncuestaService],
  exports: [EncuestaService],
})
export class EncuestaModule {}
