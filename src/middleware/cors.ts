import { config } from "dotenv";
import { cors } from "hono/cors";

config({ path: ".env" });

const devOrigins = [
  "http://localhost:3000",
  "http://localhost:9245",
  "http://127.0.0.1:9245",
  "http://localhost:9246",
  "http://127.0.0.1:9246",
];

const desktopOrigins = [
  "wails://localhost",
  "wails://localhost:9245",
  "wails://wails",
  "http://wails.localhost",
];

export const allowedOrigins = [
  process.env.APP_URL,
  process.env.BETTER_AUTH_URL,
  ...desktopOrigins,
  ...(process.env.NODE_ENV !== "production" ? devOrigins : []),
].filter(Boolean) as string[];

export const corsMiddleware = cors({
  origin: (origin) => {
    if (!origin) return origin;
    return allowedOrigins.includes(origin) ? origin : null;
  },
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["POST", "GET", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: true,
});
