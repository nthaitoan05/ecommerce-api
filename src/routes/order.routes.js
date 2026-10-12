import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middlewares/auth.js";
import { createOrder } from "../services/order.service.js";

const router = Router();

// Tất cả endpoint đơn hàng đều yêu cầu đăng nhập
router.use(requireAuth);

router.param("oid", (req, res, next, value) => {
  const oid = Number(value);

  if (
    !/^\d+$/.test(value) ||
    !Number.isInteger(oid) ||
    oid <= 0 ||
    oid > 2147483647
  ) {
    return res.status(400).json({
      message: "Mã đơn hàng không hợp lệ",
    });
  }

  req.orderId = oid;
  next();
});

// Đặt hàng
router.post("/", async (req, res) => {
  const order = await createOrder(
    req.user.uid,
    req.body?.items,
  );

  res.status(201).json(order);
});

// Danh sách đơn của người đang đăng nhập
router.get("/", async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { uid: req.user.uid },
    orderBy: { oid: "desc" },
    include: {
      details: true,
      shipments: true,
    },
  });

  res.json(orders);
});

// Xem chi tiết một đơn của mình
router.get("/:oid", async (req, res) => {
  const order = await prisma.order.findFirst({
    where: {
      oid: req.orderId,
      uid: req.user.uid,
    },
    include: {
      details: {
        include: {
          product: {
            select: {
              pid: true,
              pname: true,
            },
          },
        },
      },
      shipments: true,
    },
  });

  if (!order) {
    return res.status(404).json({
      message: "Không tìm thấy đơn hàng",
    });
  }

  res.json(order);
});

// Xem thông tin giao hàng của một đơn
router.get("/:oid/shipments", async (req, res) => {
  const order = await prisma.order.findFirst({
    where: {
      oid: req.orderId,
      uid: req.user.uid,
    },
    include: {
      shipments: true,
    },
  });

  if (!order) {
    return res.status(404).json({
      message: "Không tìm thấy đơn hàng",
    });
  }

  res.json(order.shipments);
});

export default router;