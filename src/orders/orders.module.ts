import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from '@/lib/prisma';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs, PRODUCT_SERVICE } from '@/config';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  imports: [
    ClientsModule.register([
      {
        name: PRODUCT_SERVICE,
        transport: Transport.TCP,
        options: {
          host: envs.PRODUCTS_MICROSERVICE_HOST,
          port: envs.PRODUCTS_MICROSERVICE_PORT,
        },
      },
    ]),
  ],
})
export class OrdersModule {}
