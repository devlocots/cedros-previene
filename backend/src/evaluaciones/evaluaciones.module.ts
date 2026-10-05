import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EvaluacionesController } from './evaluaciones.controller';
import { EvaluacionesService } from './evaluaciones.service';

@Module({
  imports: [AuthModule],
  controllers: [EvaluacionesController],
  providers: [EvaluacionesService],
})
export class EvaluacionesModule {}
