import { Hono } from "hono";

import {
  createClassroom,
  getClassByClassId,
} from "../controllers/Classrooms.controller.js";

const app = new Hono();

app.post("/", (c) => createClassroom(c));

app.get("/:classId", (c) => getClassByClassId(c));

export default app;
