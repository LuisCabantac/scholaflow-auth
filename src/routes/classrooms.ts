import { Hono } from "hono";

import {
  createClassroom,
  deleteClassroom,
  getClassByClassId,
  updateClassroom,
  joinClassroom,
} from "../controllers/Classrooms.controller.js";

const app = new Hono();

app.post("/", (c) => createClassroom(c));

app.get("/:classId", (c) => getClassByClassId(c));

app.patch("/:classId", (c) => updateClassroom(c));

app.delete("/:classId", (c) => deleteClassroom(c));

app.post("/:classId/join", (c) => joinClassroom(c));

export default app;
