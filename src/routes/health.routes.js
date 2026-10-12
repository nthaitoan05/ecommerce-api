import { Router } from "express";
import { prisma } from "../config/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: "healthy",
      service: "ecommerce-api",
      database: "connected",
    });
  } catch {
    return res.status(503).json({
      status: "unhealthy",
      service: "ecommerce-api",
      database: "unavailable",
    });
  }
});

export default router;