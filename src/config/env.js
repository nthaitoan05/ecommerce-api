import "dotenv/config";

export const env = {
  host: process.env.HOST || "0.0.0.0",
  port: Number(process.env.PORT || 3001),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
};

if (!env.jwtSecret || env.jwtSecret.length < 32) {
  throw new Error("JWT_SECRET phải có ít nhất 32 ký tự");
}

if (
  !Number.isInteger(env.port) ||
  env.port < 1 ||
  env.port > 65535
) {
  throw new Error("PORT không hợp lệ");
}