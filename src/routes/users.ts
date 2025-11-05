import { Hono } from "hono";

import {
  getUserByEmail,
  getUserById,
} from "../controllers/Users.controller.js";
import { getAllClasses } from "../controllers/Classrooms.controller.js";

const app = new Hono();

app.get("/", (c) => getUserByEmail(c));

app.get("/:userId", (c) => getUserById(c));

app.get("/:userId/classrooms", (c) => getAllClasses(c));

export default app;
