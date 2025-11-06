import { Hono } from "hono";

import { getAccountByUserId } from "../controllers/Accounts.controller.js";

const app = new Hono();

app.get("/accounts/:userId", (c) => getAccountByUserId(c));

export default app;
