import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("Thiếu DATABASE_URL trong file .env");
}

const connectTimeout = Number(
  process.env.DB_CONNECT_TIMEOUT_MS || 3000,
);

const queryTimeout = Number(
  process.env.DB_QUERY_TIMEOUT_MS || 3000,
);

if (
  !Number.isInteger(connectTimeout) ||
  connectTimeout <= 0 ||
  !Number.isInteger(queryTimeout) ||
  queryTimeout <= 0
) {
  throw new Error("Thời gian timeout database phải là số nguyên dương");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: connectTimeout,
  statement_timeout: queryTimeout,
});

export const prisma = new PrismaClient({ adapter });