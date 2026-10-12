import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// Đăng ký
router.post("/register", async (req, res) => {
  const { username, fullname, password } = req.body || {};

  if (
    typeof username !== "string" ||
    !/^[A-Za-z0-9_]{3,50}$/.test(username)
  ) {
    return res.status(400).json({
      message: "Username gồm 3–50 ký tự: chữ, số hoặc dấu gạch dưới",
    });
  }

  if (
    typeof fullname !== "string" ||
    fullname.trim().length === 0 ||
    fullname.trim().length > 100
  ) {
    return res.status(400).json({
      message: "Họ tên phải có từ 1 đến 100 ký tự",
    });
  }

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    bcrypt.truncates(password)
  ) {
    return res.status(400).json({
      message: "Mật khẩu phải có ít nhất 8 ký tự và không quá 72 byte",
    });
  }

  const [role, membership] = await Promise.all([
    prisma.role.findUnique({
      where: { rolename: "normal" },
    }),
    prisma.memberShip.findUnique({
      where: { mname: "basic" },
    }),
  ]);

  if (!role || !membership) {
    return res.status(503).json({
      message: "Thiếu dữ liệu khởi tạo, hãy chạy npm run seed",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username,
      fullname: fullname.trim(),
      password: hashedPassword,
      roleid: role.roleid,
      mid: membership.mid,
    },
    select: {
      uid: true,
      username: true,
      fullname: true,
      role: true,
      membership: true,
    },
  });

  return res.status(201).json({
    message: "Đăng ký thành công",
    user,
  });
});

// Đăng nhập
router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    password.length === 0 ||
    bcrypt.truncates(password)
  ) {
    return res.status(400).json({
      message: "Username hoặc password không hợp lệ",
    });
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({
      message: "Sai tên đăng nhập hoặc mật khẩu",
    });
  }

  const token = jwt.sign({}, env.jwtSecret, {
    subject: String(user.uid),
    algorithm: "HS256",
    expiresIn: env.jwtExpiresIn,
  });

  return res.json({
    message: "Đăng nhập thành công",
    token,
    tokenType: "Bearer",
  });
});

// Thông tin tài khoản đang đăng nhập
router.get("/me", requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

export default router;