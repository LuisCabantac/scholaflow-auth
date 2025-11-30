import { and, desc, eq, ne } from "drizzle-orm";

import { db } from "../../db/index.js";
import { stream } from "../../db/schema.js";
import type { Stream } from "../schema/index.js";

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
