import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "dotenv";

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
