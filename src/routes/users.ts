import { Hono } from "hono";

import { getAllClasses } from "../controllers/Classrooms.controller.js";
import {
  getUserByEmail,
  getUserById,
  updateProfile,
} from "../controllers/Users.controller.js";

const app = new Hono();

app.get("/", (c) => getUserByEmail(c));

app.get("/:userId", (c) => getUserById(c));

app.patch("/:userId", (c) => updateProfile(c));

app.get("/:userId/classrooms", (c) => getAllClasses(c));

export default app;
