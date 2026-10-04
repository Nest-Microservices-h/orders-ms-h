# orders-ms

Orders microservice built with NestJS and NATS. It does not expose an HTTP API; the gateway and other services communicate with it through NestJS message patterns over `Transport.NATS`.

```
┌─────────┐   NATS   ┌───────────┐   NATS   ┌────────────┐
│ Gateway │ ───────► │ orders-ms │ ───────► │ products-ms│
└─────────┘         └─────┬─────┘         └────────────┘
                           │
                           ▼
                     PostgreSQL :5433
```

When creating an order, the service validates each `productId` against products via the `validate-products` command, calculates the total using the prices returned by products (not the values in the payload), and persists an `Order` and its `OrderItem` records.

## Requirements

- Node.js **20.19+** (Prisma 7)
- Docker and Docker Compose
- A NATS server reachable from the app through `NATS_SERVERS` (example: `nats://localhost:4222`)
- **products-ms** listening on NATS and answering `{ cmd: 'validate-products' }`
- PostgreSQL instance for the orders database

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

The service logs `Orders MS running on port 3002` during startup, but it is a NestJS microservice running over NATS rather than opening a direct TCP listener on that port.

## Environment variables

| Variable | Example | Role |
| --- | --- | --- |
| `PORT` | `3002` | Local application port label used in the startup log |
| `DATABASE_URL` | `postgres://postgres:123456@localhost:5433/ordersdb?schema=public` | PostgreSQL connection string (host port **5433**, mapped to container port **5432**) |
| `NATS_SERVERS` | `nats://localhost:4222` | Comma-separated list of NATS servers |
| `PRODUCTS_MICROSERVICE_HOST` | `localhost` | Legacy option kept in config; it is not used by the current NATS transport |
| `PRODUCTS_MICROSERVICE_PORT` | `3001` | Legacy option kept in config; it is not used by the current NATS transport |

Joi validates these variables at startup. The process will not start if any required value is missing or malformed.

`docker-compose.yml` starts `orders_database` (`postgres:18`) with the `postgres` user, password `123456`, and database `ordersdb`. The local `./postgres` volume is listed in `.gitignore`.

## NATS contracts

Patterns handled by `OrdersController`. Payloads are validated with class-validator DTOs (`whitelist` + `forbidNonWhitelisted`).

| Pattern | Payload | Notes |
| --- | --- | --- |
| `createOrder` | `{ items: [{ productId, quantity, price }] }` | `items` must contain at least one entry. `price` is required by the DTO; the persisted amount is sourced from products-ms. |
| `findAllOrders` | `{ page?, limit?, status? }` | `page` defaults to 1 and `limit` defaults to 10. `status`: `PENDING` \| `PAID` \| `DELIVERED` \| `CANCELLED`. |
| `findOneOrder` | `{ id }` | UUID v4. The response is enriched with the product `name`. |
| `changeOrderStatus` | `{ id, status }` | Accepts the same statuses listed above. |

Example client in a NestJS app:

```ts
this.ordersClient.send('createOrder', {
  items: [{ productId: 1, quantity: 2, price: 1 }],
});
```

Products must respond to `{ cmd: 'validate-products' }` with an array of products, such as `{ id, name, price, ... }`.

## Prisma

Schema: `prisma/schema.prisma`. The Prisma CLI loads `prisma7.config.ts` only.

```bash
# Development: create a migration from the schema
npx prisma migrate dev --name <nombre>

# Already-migrated environments / CI
npx prisma migrate deploy

npx prisma studio
```

## Scripts

| Script | Usage |
| --- | --- |
| `npm run start:dev` | Watch mode; intended for local development |
| `npm run start` | Run once, without watch mode |
| `npm run build` / `npm run start:prod` | `node dist/main` (requires `.env` and a generated Prisma client) |
| `npm run lint` | oxlint |
| `npm test` | Jest starter suite; it does not cover the NATS message flow |

## Troubleshooting

1. **`Invalid environment variables`**: `.env` has not been copied, or an environment variable name does not match the schema.
2. **`Can't reach database` / P1001**: Docker Compose is not running, or `DATABASE_URL` uses host port `5432`. The published host port is **5433**.
3. **Prisma generation fails / imports from `@/generated/prisma` fail**: run `npx prisma generate`.
4. **NATS connection errors / timeout**: the NATS server is not running or `NATS_SERVERS` is configured incorrectly.
5. **Product not found / validation fails**: the product service is unavailable or it is not answering `{ cmd: 'validate-products' }` with the expected payload.

## Technology stack

NestJS 12 (NATS microservice), Prisma 7 with `@prisma/adapter-pg`, NATS, and PostgreSQL 18.
