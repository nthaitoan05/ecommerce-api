import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

export async function requireAuth(req, res, next) {
  const authorization = req.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({
      message: "Bạn cần đăng nhập",
    });
  }

  let payload;

  try {
    payload = jwt.verify(match[1], env.jwtSecret, {
      algorithms: ["HS256"],
    });
  } catch {
    return res.status(401).json({
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }

  const uid = Number(payload.sub);

  if (!Number.isSafeInteger(uid) || uid <= 0) {
    return res.status(401).json({
      message: "Token không hợp lệ",
    });
  }

  const user = await prisma.user.findUnique({
    where: { uid },
    select: {
      uid: true,
      username: true,
      fullname: true,
      role: true,
      membership: true,
    },
  });

  if (!user) {
    return res.status(401).json({
      message: "Tài khoản không còn tồn tại",
    });
  }

  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role?.rolename !== "admin") {
    return res.status(403).json({
      message: "Bạn không có quyền quản trị viên",
    });
  }

  next();
}