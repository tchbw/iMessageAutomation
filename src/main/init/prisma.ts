// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { PrismaClient as _PrismaClient } from "@prisma/client";

const createPrismaClient = (): _PrismaClient => {
  console.log(
    import.meta.env.MAIN_VITE_APP_DATABASE_URL,
    `MAIN_VITE_APP_DATABASE_URL meow`
  );
  const _prisma = new _PrismaClient({
    // log: _prismaLogLevel(),
    datasourceUrl: import.meta.env.MAIN_VITE_APP_DATABASE_URL,
  });

  return _prisma;
};

// export type PrismaClient = ReturnType<typeof createExtendedPrismaClient>;
export type PrismaClient = ReturnType<typeof createPrismaClient>;
export type PrismaTransactionClient = Parameters<
  Parameters<PrismaClient[`$transaction`]>[0]
>[0];

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

// Cache prisma clients in non-production environments
// https://github.com/prisma/prisma/issues/1983#issuecomment-620621213
let prisma: PrismaClient;

if (process.env.NODE_ENV === `production`) {
  prisma = createPrismaClient();
} else {
  if (globalForPrisma.prisma) {
    prisma = globalForPrisma.prisma;
  } else {
    prisma = createPrismaClient();
    globalForPrisma.prisma = prisma;
  }
}

export { prisma };
