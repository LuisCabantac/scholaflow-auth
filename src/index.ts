import { Hono } from "hono";
import { config } from "dotenv";
import { serve } from "@hono/node-server";

import { auth } from "./lib/auth.js";
import { corsMiddleware } from "./middleware/cors.js";

config({ path: ".env" });

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    message: "ScholaFlow Auth",
    version: "1.0.0",
    status: "running",
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/healthz", (c) => {
  return c.text("OK");
});

app.use("/api/auth/*", corsMiddleware);

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
  },
);
