import { and, count, desc, eq, ilike, ne, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { stream } from "../../db/schema.js";
import type { Stream } from "../schema/index.js";
import { getAllEnrolledClassesByUserId } from "./classroom.js";

export async function getStreamByStreamId(
  streamId: string
): Promise<Stream | null> {
  const [data] = await db.select().from(stream).where(eq(stream.id, streamId));

  return data || null;
}

export async function getAllStreamsByClassId(
  classId: string
): Promise<Stream[] | null> {
  const data = await db
    .select()
    .from(stream)
    .where(and(eq(stream.classId, classId), ne(stream.type, "stream")))
    .orderBy(desc(stream.createdAt));

  return !data?.length ? null : data;
}

export async function getAllClassesStreamByUserId(
  userId: string
): Promise<Stream[] | null> {
  const data = await db.select().from(stream).where(eq(stream.userId, userId));

  return !data?.length ? null : data;
}

export async function getAllStreamsByTopicId(
  topicId: string
): Promise<Stream[] | null> {
  const data = await db
    .select()
    .from(stream)
    .where(and(eq(stream.topicId, topicId), ne(stream.type, "stream")))
    .orderBy(desc(stream.createdAt));

  return !data?.length ? null : data;
}

export async function getClassworksByClassIdQuery(
  classId: string,
  query: string
): Promise<Stream[] | null> {
  const data = await db
    .select()
    .from(stream)
    .where(
      and(
        eq(stream.classId, classId),
        ne(stream.type, "stream"),
        ilike(stream.title, `%${query}%`)
      )
    )
    .orderBy(desc(stream.createdAt));

  return !data?.length ? null : data;
}

export async function getAllEnrolledClassesClassworks(
  userId: string
): Promise<Stream[] | null> {
  const enrolledClasses = await getAllEnrolledClassesByUserId(userId);

  const classworks = Array.isArray(enrolledClasses)
    ? await Promise.all(
        enrolledClasses.map(
          async (enrolledClass) =>
            await getAllStreamsByClassId(enrolledClass.classId)
        )
      )
    : [];

  return classworks.filter((array): array is Stream[] => array !== null).flat();
}

export async function getStreamsByClassIdPaginated(
  classId: string,
  userId: string,
  teacherId: string,
  limit: number,
  offset: number,
  streamType?: string
): Promise<{ data: Stream[]; total: number }> {
  const now = new Date();

  const baseConditions = [
    eq(stream.classId, classId),
    ne(stream.type, "stream"),
    or(
      eq(stream.announceToAll, true),
      eq(stream.userId, userId),
      eq(stream.userId, teacherId),
      and(
        sql`${stream.announceTo} @> ARRAY[${userId}]::text[]`,
        eq(stream.announceToAll, false)
      )
    ),
    or(
      sql`${stream.scheduledAt} IS NULL`,
      sql`${stream.scheduledAt} < ${now}`,
      eq(stream.userId, teacherId)
    ),
  ];

  const whereClause = streamType
    ? and(
        ...baseConditions,
        eq(
          stream.type,
          streamType as "assignment" | "quiz" | "question" | "material"
        )
      )
    : and(...baseConditions);

  const [streams, countResult] = await Promise.all([
    db
      .select()
      .from(stream)
      .where(whereClause)
      .orderBy(desc(stream.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(stream).where(whereClause),
  ]);

  const total = countResult[0]?.count || 0;

  return { data: streams, total };
}
