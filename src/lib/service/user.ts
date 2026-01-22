import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { user } from "../../db/schema.js";

export async function getUserByEmailAddress(email: string) {
  const [data] = await db.select().from(user).where(eq(user.email, email));

  return data || null;
}
