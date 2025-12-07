import { and, eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { classwork } from "../../db/schema.js";
import { getStreamByStreamId } from "./stream.js";
import type { Classwork } from "../schema/index.js";
import { getClassroomByClassId } from "./classroom.js";

export async function getAllClassworksByClassId(
  classId: string
): Promise<Classwork[] | null> {
  const data = await db
    .select()
    .from(classwork)
    .where(eq(classwork.classId, classId));

  return !data?.length ? null : data;
}

export async function getAllClassworksByStreamId(
  streamId: string
): Promise<Classwork[] | null> {
  const data = await db
    .select()
    .from(classwork)
    .where(eq(classwork.streamId, streamId));

  return !data?.length ? null : data;
}

export async function getAllClassworksByUserId(
  userId: string
): Promise<Classwork[] | null> {
  const data = await db
    .select()
    .from(classwork)
    .where(eq(classwork.userId, userId));

  return !data?.length ? null : data;
}

export async function getAllClassworksByClassAndUserId(
  userId: string,
  classId: string
): Promise<Classwork[] | null> {
  const classroom = await getClassroomByClassId(classId);
  if (!classroom) return null;

  const data = await db
    .select()
    .from(classwork)
    .where(and(eq(classwork.userId, userId), eq(classwork.classId, classId)));

  return !data?.length ? null : data;
}

export async function getClassworkByClassAndUserId(
  userId: string,
  classId: string,
  streamId: string
): Promise<Classwork | null> {
  const classroom = await getClassroomByClassId(classId);
  if (!classroom) return null;

  const stream = await getStreamByStreamId(streamId);
  if (!stream) return null;

  if (!(stream.announceToAll || stream.announceTo.includes(userId)))
    return null;

  const [data] = await db
    .select()
    .from(classwork)
    .where(and(eq(classwork.userId, userId), eq(classwork.streamId, streamId)));

  return data || null;
}

export async function getAllAssignedClassworksByStreamUserAndClassroomId(
  classId: string,
  userId: string,
  streamId: string
): Promise<Classwork[] | null> {
  const classroom = await getClassroomByClassId(classId);
  if (!classroom) return null;

  if (classroom.teacherId !== userId) return null;

  const data = await db
    .select()
    .from(classwork)
    .where(
      and(eq(classwork.classId, classId), eq(classwork.streamId, streamId))
    );

  return !data?.length ? null : data;
}
