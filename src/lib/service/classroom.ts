import { and, desc, eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { classroom, enrolledClass } from "../../db/schema.js";
import type {
  Classroom,
  EnrolledClass,
  EnrolledUser,
} from "../schema/index.js";

export async function getAllEnrolledClassesByClassId(
  classId: string,
): Promise<EnrolledClass[] | null> {
  const data = await db
    .select()
    .from(enrolledClass)
    .where(eq(enrolledClass.classId, classId));

  return !data?.length ? null : data;
}

export async function getAllEnrolledUsersByClassId(
  classId: string,
): Promise<EnrolledUser[] | null> {
  const data = await db
    .select({
      id: enrolledClass.id,
      userId: enrolledClass.userId,
      userName: enrolledClass.userName,
      userImage: enrolledClass.userImage,
    })
    .from(enrolledClass)
    .where(eq(enrolledClass.classId, classId));

  return !data?.length ? null : data;
}

export async function getClassroomByClassId(
  classId: string,
): Promise<Classroom | null> {
  const [data] = await db
    .select()
    .from(classroom)
    .where(eq(classroom.id, classId));

  return data || null;
}

export async function getClassroomByClassCode(
  classCode: string,
): Promise<Classroom | null> {
  const [data] = await db
    .select()
    .from(classroom)
    .where(eq(classroom.code, classCode));

  return data || null;
}

export async function getEnrolledClassByClassAndUserId(
  userId: string,
  classId: string,
): Promise<EnrolledClass | null> {
  const [data] = await db
    .select()
    .from(enrolledClass)
    .where(
      and(eq(enrolledClass.classId, classId), eq(enrolledClass.userId, userId)),
    );

  return data || null;
}

export async function getAllEnrolledClassesIdByClassId(
  classId: string,
): Promise<string[] | null> {
  const data = await db
    .select({ id: enrolledClass.id })
    .from(enrolledClass)
    .where(eq(enrolledClass.classId, classId));

  return !data?.length ? null : data.map((row) => row.id);
}

export async function getAllEnrolledClassesByUserId(
  userId: string,
): Promise<EnrolledClass[] | null> {
  const data = await db
    .select()
    .from(enrolledClass)
    .where(eq(enrolledClass.userId, userId))
    .orderBy(desc(enrolledClass.createdAt));

  return !data?.length ? null : data;
}

export async function getEnrolledClassByEnrolledClassId(
  enrolledClassId: string,
): Promise<EnrolledClass | null> {
  const [data] = await db
    .select()
    .from(enrolledClass)
    .where(eq(enrolledClass.id, enrolledClassId));

  return data || null;
}
