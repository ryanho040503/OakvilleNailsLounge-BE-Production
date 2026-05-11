const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "..", ".env"),
});

function parseCorsOrigin(value) {
  if (!value || !value.trim()) {
    return ["http://localhost:3000"];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const config = {
  appName: process.env.APP_NAME || "Oakville Nails Lounge API",
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3001),
  corsOrigin: parseCorsOrigin(
    process.env.CORS_ORIGIN || "http://localhost:3000,https://oakville-nails-lounge-fe.vercel.app",
  ),
  apiBasePath: process.env.API_BASE_PATH || "/api",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresInSeconds: Number(process.env.JWT_EXPIRES_IN_SECONDS || 60 * 60 * 8),
  adminUsername: process.env.ADMIN_USERNAME || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
};

module.exports = config;
