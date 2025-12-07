import { desc, eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { classTopic } from "../../db/schema.js";
import type { ClassTopic } from "../schema/index.js";

export async function getClassTopicByTopicId(
  topicId: string
): Promise<ClassTopic | null> {
  const [data] = await db
    .select()
    .from(classTopic)
    .where(eq(classTopic.id, topicId));

  return data || null;
}

export async function getAllClassTopicIdsByClassId(
  classId: string
): Promise<string[] | null> {
  const data = await db
    .select()
    .from(classTopic)
    .where(eq(classTopic.classId, classId))
    .orderBy(desc(classTopic.createdAt));

  return !data.length ? null : data.map((row) => row.id);
}
