import { prisma } from "../src/config/prisma.js";

async function main() {
  const [adminRole, normalRole, membership] =
    await prisma.$transaction([
      prisma.role.upsert({
        where: { rolename: "admin" },
        update: {},
        create: { rolename: "admin" },
      }),

      prisma.role.upsert({
        where: { rolename: "normal" },
        update: {},
        create: { rolename: "normal" },
      }),

      prisma.memberShip.upsert({
        where: { mname: "basic" },
        update: {},
        create: {
          mname: "basic",
          score: 10,
        },
      }),
    ]);

  console.log("Kết nối PostgreSQL và seed thành công!");

  console.log("Vai trò:");
  console.table([adminRole, normalRole]);

  console.log("Hạng thành viên:");
  console.table([membership]);
}

try {
  await main();
} catch (error) {
  console.error("Seed thất bại:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}