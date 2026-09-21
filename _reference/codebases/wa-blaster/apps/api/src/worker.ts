import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerAppModule } from './worker-app.module';

async function bootstrap() {
  const logger = new Logger('Worker');
  const app = await NestFactory.createApplicationContext(WorkerAppModule, {
    bufferLogs: false,
  });
  logger.log('Worker process started — listening for blast jobs');
  // Keep the process alive
  await new Promise<never>(() => {});
  await app.close();
}
bootstrap();
