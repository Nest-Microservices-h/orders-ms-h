import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import { Logger } from '@nestjs/common';
import chalk from 'chalk';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('OrdersMS Main');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
    },
  );

  logger.log(
    `${chalk.green('Orders MS')} ${chalk.cyan('running on port')} ${chalk.magenta(envs.PORT)}`,
  );
}
bootstrap();
