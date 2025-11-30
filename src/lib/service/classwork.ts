import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { classwork } from "../../db/schema.js";
import type { Classwork } from "../schema/index.js";

export async function getAllClassworksByUserId(
  userId: string
): Promise<Classwork[] | null> {
  const data = await db
    .select()
    .from(classwork)
    .where(eq(classwork.userId, userId));

  return !data?.length ? null : data;
}
