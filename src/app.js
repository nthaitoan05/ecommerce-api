import healthRoutes from "./routes/health.routes.js";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import { HttpError } from "./utils/http-error.js";

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

// Đăng ký các nhóm endpoint
app.use("/health", healthRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// Không tìm thấy endpoint
app.use((req, res) => {
  res.status(404).json({
    message: "Không tìm thấy endpoint",
  });
});

// Xử lý lỗi tập trung
app.use((error, req, res, next) => {
  // Lỗi nghiệp vụ, ví dụ đặt hàng vượt tồn kho
  if (error instanceof HttpError) {
    return res.status(error.status).json({
      message: error.message,
    });
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Nội dung JSON không hợp lệ",
    });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      message: "Dữ liệu gửi lên quá lớn",
    });
  }

  if (error.code === "P2002") {
    return res.status(409).json({
      message: "Dữ liệu bị trùng ở trường yêu cầu duy nhất",
    });
  }

  if (error.code === "P2025") {
    return res.status(404).json({
      message: "Không tìm thấy dữ liệu cần xử lý",
    });
  }

  if (error.code === "P2003") {
    return res.status(409).json({
      message: "Không thể thực hiện vì có dữ liệu liên kết",
    });
  }

  console.error("Lỗi server:", error.code || error.name);

  return res.status(500).json({
    message: "Lỗi máy chủ",
  });
});

export default app;