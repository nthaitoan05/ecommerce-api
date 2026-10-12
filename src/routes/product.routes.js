import { Router } from "express";
import { prisma } from "../config/prisma.js";
import {
  requireAuth,
  requireAdmin,
} from "../middlewares/auth.js";

const router = Router();

// Kiểm tra mã sản phẩm trong URL
router.param("pid", (req, res, next, value) => {
  const pid = Number(value);

  if (
    !/^\d+$/.test(value) ||
    !Number.isInteger(pid) ||
    pid <= 0 ||
    pid > 2147483647
  ) {
    return res.status(400).json({
      message: "Mã sản phẩm phải là số nguyên dương hợp lệ",
    });
  }

  req.productId = pid;
  next();
});

// Kiểm tra dữ liệu thêm hoặc sửa sản phẩm
function validateProduct(req, res, next) {
  const { pname, price, quantity } = req.body || {};

  if (
    typeof pname !== "string" ||
    pname.trim().length === 0 ||
    pname.trim().length > 100
  ) {
    return res.status(400).json({
      message: "Tên sản phẩm phải có từ 1 đến 100 ký tự",
    });
  }

  const priceText =
    typeof price === "number" || typeof price === "string"
      ? String(price).trim()
      : "";

  if (!/^(0|[1-9]\d{0,7})(\.\d{1,2})?$/.test(priceText)) {
    return res.status(400).json({
      message: "Giá phải từ 0 đến 99999999.99, tối đa 2 chữ số thập phân",
    });
  }

  if (
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    quantity > 2147483647
  ) {
    return res.status(400).json({
      message: "Số lượng phải là số nguyên từ 0 đến 2147483647",
    });
  }

  req.productData = {
    pname: pname.trim(),
    price: priceText,
    quantity,
  };

  next();
}

// Danh sách sản phẩm
router.get("/", async (req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { pid: "asc" },
  });

  res.json(products);
});

// Chi tiết sản phẩm
router.get("/:pid", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { pid: req.productId },
  });

  if (!product) {
    return res.status(404).json({
      message: "Không tìm thấy sản phẩm",
    });
  }

  res.json(product);
});

// Thêm sản phẩm
router.post(
  "/",
  requireAuth,
  requireAdmin,
  validateProduct,
  async (req, res) => {
    const product = await prisma.product.create({
      data: req.productData,
    });

    res.status(201).json(product);
  },
);

// Cập nhật toàn bộ thông tin sản phẩm
router.put(
  "/:pid",
  requireAuth,
  requireAdmin,
  validateProduct,
  async (req, res) => {
    const product = await prisma.product.update({
      where: { pid: req.productId },
      data: req.productData,
    });

    res.json(product);
  },
);

// Xóa sản phẩm
router.delete(
  "/:pid",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    await prisma.product.delete({
      where: { pid: req.productId },
    });

    res.status(204).end();
  },
);

export default router;