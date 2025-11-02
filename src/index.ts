import { Hono } from "hono";
import { config } from "dotenv";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";

import { auth } from "./lib/auth.js";

config({ path: ".env.local" });

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    message: "ScholaFlow Backend API",
    version: "1.0.0",
    status: "running",
    environment: process.env.NODE_ENV || "development",
  });
});

app.use(
  "/api/auth/*",
  cors({
    origin: (origin) => {
      const allowedOrigins = [
        process.env.BETTER_AUTH_URL || "http://localhost:8080",
        ...(process.env.ALLOWED_ORIGINS?.split(",") || []),
      ];
      return allowedOrigins.includes(origin) ? origin : null;
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

serve(
  {
    fetch: app.fetch,
    port: port,
  },
  (info) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`Server is running on port ${info.port}`);
    }
  }
);
