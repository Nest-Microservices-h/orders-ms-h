import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import {
  MicroserviceOptions,
  RpcException,
  Transport,
} from '@nestjs/microservices';

import { AppModule } from './app.module';
import { envs } from './config';
import chalk from 'chalk';

async function bootstrap() {
  const logger = new Logger('OrdersMS Main');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: envs.PORT,
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((error) =>
          Object.values(error.constraints ?? {}),
        );

        return new RpcException({
          status: 400,
          message: messages.join(', '),
        });
      },
    }),
  );

  await app.listen();
  logger.log(
    `${chalk.green('Orders MS')} ${chalk.cyan('running on port')} ${chalk.magenta(envs.PORT)}`,
  );
}
bootstrap();
