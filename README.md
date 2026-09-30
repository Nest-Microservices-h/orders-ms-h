# orders-ms

Orders microservice built with NestJS and TCP. It does not expose an HTTP API; the gateway and other services communicate with it over `Transport.TCP`.

```
┌─────────┐   TCP :3002    ┌───────────┐   TCP :3001    ┌────────────┐
│ Gateway │ ─────────────► │ orders-ms │ ─────────────► │ products-ms│
└─────────┘                └─────┬─────┘                └────────────┘
                                 │
                                 ▼
                           PostgreSQL :5433
```

When creating an order, the service validates each `productId` against products (`cmd: validate-products`), calculates totals using the prices returned by products (not the prices in the payload), and persists an `Order` and its `OrderItem` records.

## Requirements

- Node.js **20.19+** (Prisma 7)
- Docker y Docker Compose
- **products-ms** listening over TCP (defaults to `localhost:3001`). Without it, `createOrder` and `findOneOrder` fail during product validation.

## Local setup

```bash
npm install
cp .env.template .env
docker compose up -d
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

The Prisma client is generated in `src/generated/prisma` and is **not committed**. Regenerate it after cloning the repository or changing the schema.

Confirm that the log reports `Orders MS running on port 3002`. If the service starts and then fails while connecting to products, the orders process is running correctly; products is unavailable.

## Environment variables

| Variable                     | Ejemplo                                                              | Rol                                                                              |
| ---------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `PORT`                       | `3002`                                                               | TCP port for this service                                                        |
| `DATABASE_URL`               | `postgresql://postgres:123456@localhost:5433/ordersdb?schema=public` | PostgreSQL connection string (host port **5433**, mapped to container port 5432) |
| `PRODUCTS_MICROSERVICE_HOST` | `localhost`                                                          | TCP host for products-ms                                                         |
| `PRODUCTS_MICROSERVICE_PORT` | `3001`                                                               | TCP port for products-ms                                                         |

Joi validates these variables at startup. The process will not start if any are missing.

`docker-compose.yml` starts `orders_database` (`postgres:18`) with the `postgres` user, password `123456`, and database `ordersdb`. The local `./postgres` volume is listed in `.gitignore`.

## TCP contracts

Patterns handled by `OrdersController`. Payloads are validated with class-validator DTOs (`whitelist` + `forbidNonWhitelisted`).

| Pattern             | Payload                                       | Notas                                                                                                                      |
| ------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `createOrder`       | `{ items: [{ productId, quantity, price }] }` | `items` must contain at least one entry. `price` is required by the DTO; the persisted amount is sourced from products-ms. |
| `findAllOrders`     | `{ page?, limit?, status? }`                  | `page` defaults to 1 and `limit` defaults to 10. `status`: `PENDING` \| `PAID` \| `DELIVERED` \| `CANCELLED`.              |
| `findOneOrder`      | `{ id }`                                      | UUID v4. The response is enriched with the product `name`.                                                                 |
| `changeOrderStatus` | `{ id, status }`                              | Accepts the same statuses listed above.                                                                                    |

Ejemplo de cliente Nest:

```ts
this.ordersClient.send('createOrder', {
  items: [{ productId: 1, quantity: 2, price: 1 }],
});
```

Products must respond to `{ cmd: 'validate-products' }` with an array of products, such as `{ id, name, price, ... }`.

## Prisma

Schema: `prisma/schema.prisma`. El CLI carga `prisma7.config.ts` solo.

```bash
# Development: create a migration from the schema
npx prisma migrate dev --name <nombre>

# Already-migrated environments / CI
npx prisma migrate deploy

npx prisma studio
```

## Scripts

| Script                                 | Uso                                                              |
| -------------------------------------- | ---------------------------------------------------------------- |
| `npm run start:dev`                    | Watch mode; intended for local development                       |
| `npm run start`                        | Run once, without watch mode                                     |
| `npm run build` / `npm run start:prod` | `node dist/main` (requires `.env` and a generated Prisma client) |
| `npm run lint`                         | oxlint                                                           |
| `npm test`                             | Jest (Nest starter suite; does not cover the TCP flow)           |

## Troubleshooting

1. **`Invalid environment variables`**: `.env` has not been copied, or an environment variable name does not match.
2. **`Can't reach database` / P1001**: Docker Compose is not running, or `DATABASE_URL` uses host port `5432`. The published host port is **5433**.
3. **Prisma generation fails / imports from `@/generated/prisma` fail**: run `npx prisma generate`.
4. **Timeout / ECONNREFUSED when connecting to products**: products-ms is not listening at the configured `PRODUCTS_MICROSERVICE_*` address.
5. **Product not found**: the ID does not exist, or products returned an incomplete list.

## Technology stack

NestJS 12 (TCP microservice), Prisma 7 with `@prisma/adapter-pg`, and PostgreSQL 18.
