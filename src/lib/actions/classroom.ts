import type { Context } from "hono";
import { and, eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { enrolledClass } from "../../db/schema.js";
import { deleteAllClassworkByClassAndUserId } from "./classwork.js";
import { deleteAllNotificationsByResourceId } from "./notification.js";
import {
  getClassroomByClassId,
  getEnrolledClassByEnrolledClassId,
} from "../service/classroom.js";

export async function updateEnrolledClass(
  enrolledClassId: string,
  updatedClass: {
    teacherName: string;
    teacherImage: string;
    name: string;
    section: string;
    subject: string | null;
    cardBackground: string;
  }
) {
  await db
    .update(enrolledClass)
    .set(updatedClass)
    .where(eq(enrolledClass.id, enrolledClassId))
    .returning();
}

export async function deleteMultipleEnrolledClass(classId: string[]) {
  for (const resourceId of classId) {
    await deleteAllNotificationsByResourceId(resourceId);
    await db.delete(enrolledClass).where(eq(enrolledClass.id, resourceId));
  }
}

export async function deleteEnrolledClassbyClassAndEnrolledClassId(
  enrolledClassId: string,
  classId: string,
  userId: string,
  ctx: Context
) {
  const currentEnrolledClass = await getEnrolledClassByEnrolledClassId(
    enrolledClassId
  );
  if (!currentEnrolledClass)
    throw new Error("You are not a member of this class.");

  const classroom = await getClassroomByClassId(classId);

  if (!classroom) throw new Error("This class doesn't exist.");

  if (
    !(classroom.teacherId === userId || currentEnrolledClass.userId === userId)
  )
    throw new Error("You're not authorized to remove this user.");

  await deleteAllClassworkByClassAndUserId(
    currentEnrolledClass.classId,
    currentEnrolledClass.userId,
    ctx
  );

  const [data] = await db
    .delete(enrolledClass)
    .where(
      and(
        eq(enrolledClass.id, enrolledClassId),
        eq(enrolledClass.classId, classId)
      )
    )
    .returning();

  if (data) {
    await deleteAllNotificationsByResourceId(data.id);
  }
}
