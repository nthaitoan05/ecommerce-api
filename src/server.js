import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

try {
  await prisma.$connect();
  console.log("Kết nối PostgreSQL thành công");

  const server = app.listen(env.port, env.host, () => {
    console.log(`API đang chạy tại http://localhost:${env.port}`);
  });

  server.on("error", (error) => {
    console.error("Không thể mở cổng API:", error.message);
    process.exit(1);
  });
} catch (error) {
  console.error("Không thể khởi động API:", error.message);
  await prisma.$disconnect();
  process.exitCode = 1;
}