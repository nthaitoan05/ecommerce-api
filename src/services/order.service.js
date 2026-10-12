import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/http-error.js";

export async function createOrder(uid, items) {
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 50
  ) {
    throw new HttpError(
      400,
      "Đơn hàng phải có từ 1 đến 50 loại sản phẩm",
    );
  }

  const productIds = new Set();

  for (const item of items) {
    if (
      !Number.isInteger(item?.pid) ||
      item.pid <= 0 ||
      item.pid > 2147483647 ||
      !Number.isInteger(item?.qty) ||
      item.qty <= 0 ||
      item.qty > 2147483647
    ) {
      throw new HttpError(
        400,
        "pid và qty phải là số nguyên dương hợp lệ",
      );
    }

    if (productIds.has(item.pid)) {
      throw new HttpError(
        400,
        "Một sản phẩm chỉ được xuất hiện một lần trong đơn",
      );
    }

    productIds.add(item.pid);
  }

  // Xử lý theo cùng thứ tự để giảm nguy cơ deadlock
  const sortedItems = [...items].sort((a, b) => a.pid - b.pid);

  return prisma.$transaction(
    async (tx) => {
      const details = [];

      for (const item of sortedItems) {
        // Chỉ trừ khi sản phẩm tồn tại và còn đủ hàng
        const result = await tx.product.updateMany({
          where: {
            pid: item.pid,
            quantity: { gte: item.qty },
          },
          data: {
            quantity: { decrement: item.qty },
          },
        });

        if (result.count !== 1) {
          throw new HttpError(
            409,
            `Sản phẩm ${item.pid} không tồn tại hoặc không đủ hàng`,
          );
        }

        const product = await tx.product.findUniqueOrThrow({
          where: { pid: item.pid },
          select: { price: true },
        });

        details.push({
          pid: item.pid,
          qty: item.qty,
          unit_price: product.price,
        });
      }

      return tx.order.create({
        data: {
          uid,
          details: {
            create: details,
          },
          shipments: {
            create: {
              status: "pending",
            },
          },
        },
        include: {
          details: true,
          shipments: true,
        },
      });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    },
  );
}