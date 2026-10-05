import { Global, Module } from '@nestjs/common';
import { MlService } from './ml.service';

@Global()
@Module({
  providers: [MlService],
  exports: [MlService],
})
export class MlModule {}
