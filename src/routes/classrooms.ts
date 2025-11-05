import { Hono } from "hono";

import {
  createClassroom,
  getClassByClassId,
} from "../controllers/Classrooms.controller.js";

const app = new Hono();

app.get("/:classId", (c) => getClassByClassId(c));

app.post("/", (c) => createClassroom(c));

export default app;
