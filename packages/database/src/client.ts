import { PrismaClient } from "../generated/client";

const createPrismaClient = () => {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            {
              emit: "stdout",
              level: "query",
            },
            {
              emit: "stdout",
              level: "error",
            },
            {
              emit: "stdout",
              level: "info",
            },
            {
              emit: "stdout",
              level: "warn",
            },
          ]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool configuration
    // Note: These settings work with Prisma's connection pooling
    // The actual pool size is controlled by the DATABASE_URL parameters
  });

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  client.$on("query" as never, (e: any) => {
    console.log(`Query: ${e.query}`);
    console.log(`Params: ${e.params}`);
    console.log(`Duration: ${e.duration}ms`);
  });

  // Log connection pool events in development
  if (process.env.NODE_ENV === "development") {
    client.$on("beforeExit" as never, async () => {
      console.log("Prisma client disconnecting...");
    });
  }

  return client;
};

// eslint-disable-next-line no-undef
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
