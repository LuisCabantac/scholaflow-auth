import { eq } from "drizzle-orm";
import { validate as validateUUID } from "uuid";

import { db } from "../../db/index.js";
import { enrolledClass } from "../../db/schema.js";
import type { EnrolledClass } from "../schema/index.js";

export async function getAllEnrolledClassesByClassId(
  classId: string
): Promise<EnrolledClass[] | null> {
  if (!classId || !validateUUID(classId)) {
    return null;
  }

  const data = await db
    .select()
    .from(enrolledClass)
    .where(eq(enrolledClass.classId, classId));

  return !data?.length ? null : data;
}

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
  const [data] = await db
    .update(enrolledClass)
    .set(updatedClass)
    .where(eq(enrolledClass.id, enrolledClassId))
    .returning();
}
