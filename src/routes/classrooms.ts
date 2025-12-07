import { Hono } from "hono";

import {
  createClassroom,
  deleteClassroom,
  getClassByClassId,
  updateClassroom,
} from "../controllers/Classrooms.controller.js";

const app = new Hono();

app.post("/", (c) => createClassroom(c));

app.get("/:classId", (c) => getClassByClassId(c));

app.patch("/:classId", (c) => updateClassroom(c));

app.delete("/:classId", (c) => deleteClassroom(c));

export default app;
