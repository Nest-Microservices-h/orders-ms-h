import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from '@/lib/prisma';
import { RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto) {
    const newOrder = await this.prisma.order.create({ data: createOrderDto });
    return newOrder;
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const totalPages = await this.prisma.order.count({
      where: { status: orderPaginationDto.status },
    });
    const currentPage = orderPaginationDto.page!;
    const perPage = orderPaginationDto.limit!;

    const data = await this.prisma.order.findMany({
      skip: (currentPage - 1) * perPage,
      take: perPage,
      where: { status: orderPaginationDto.status },
    });

    const meta = {
      total: totalPages,
      page: currentPage,
      lastPage: Math.ceil(totalPages / perPage),
    };

    return {
      data,
      meta,
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id },
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    return order;
  }

  changeStatus() {
    return 'This action changes the status of an order';
  }
}
