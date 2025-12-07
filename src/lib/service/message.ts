import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { chat } from "../../db/schema.js";
import type { Chat } from "../schema/index.js";
import {
  getClassroomByClassId,
  getEnrolledClassByClassAndUserId,
} from "./classroom.js";

export async function getAllMessagesByClassId(
  classId: string,
  userId: string
): Promise<Chat[] | null> {
  const classroom = await getClassroomByClassId(classId);

  if (!classroom) return null;

  const enrolledClass = await getEnrolledClassByClassAndUserId(userId, classId);

  if (!(classroom.teacherId === userId || enrolledClass)) return null;

  const data = await db.select().from(chat).where(eq(chat.classId, classId));

  return !data?.length ? null : data;
}

export async function getAllMessagesByUserId(
  userId: string
): Promise<Chat[] | null> {
  const data = await db.select().from(chat).where(eq(chat.userId, userId));

  return !data?.length ? null : data;
}
