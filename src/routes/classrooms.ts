import { Hono } from "hono";

import {
  createClassroom,
  getClassByClassId,
  updateClassroom,
} from "../controllers/Classrooms.controller.js";

const app = new Hono();

app.post("/", (c) => createClassroom(c));

app.get("/:classId", (c) => getClassByClassId(c));

app.patch("/:classId", (c) => updateClassroom(c));

export default app;
