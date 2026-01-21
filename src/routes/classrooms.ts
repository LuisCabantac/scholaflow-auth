import { Hono } from "hono";

import {
  createClassroom,
  deleteClassroom,
  getClassByClassId,
  updateClassroom,
  joinClassroom,
  joinClassroomByClassCode,
  getStreamsByClassId,
  getEnrolledClassesByClassId,
} from "../controllers/Classrooms.controller.js";

const app = new Hono();

app.post("/", (c) => createClassroom(c));

app.get("/:classId", (c) => getClassByClassId(c));

app.patch("/:classId", (c) => updateClassroom(c));

app.delete("/:classId", (c) => deleteClassroom(c));

app.post("/join/:classId", (c) => joinClassroom(c));

app.post("/join/code/:classCode", (c) => joinClassroomByClassCode(c));

app.get("/:classId/streams", (c) => getStreamsByClassId(c));

app.get("/:classId/people", (c) => getEnrolledClassesByClassId(c));

export default app;
