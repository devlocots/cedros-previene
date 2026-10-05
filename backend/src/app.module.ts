import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { EvaluacionesModule } from './evaluaciones/evaluaciones.module';
import { MlModule } from './ml/ml.module';
import { SeedService } from './seed/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    MlModule,
    AuthModule,
    EvaluacionesModule,
  ],
  controllers: [AppController],
  providers: [SeedService],
})
export class AppModule {}
