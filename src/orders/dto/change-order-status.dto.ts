import { OrderStatus } from '@/generated/prisma/enums';
import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';

export class ChangeOrderStatusDto {
  @IsUUID('4', { message: 'Invalid order ID format' })
  id: string;

  @IsEnum(OrderStatusList, { message: `Valid status are: ${OrderStatusList}` })
  status: OrderStatus;
}
