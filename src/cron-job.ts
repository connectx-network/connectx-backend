import { NestFactory } from '@nestjs/core';
import { CronJobModule } from 'src/_modules_/cron-job/cron-job.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(CronJobModule);
}

bootstrap();
