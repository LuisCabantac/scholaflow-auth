import { eq } from "drizzle-orm";
import type { Context } from "hono";

import { db } from "../../db/index.js";
import { chat } from "../../db/schema.js";
import { extractMessagesFilePath } from "../utils.js";
import { deleteFilesFromBucket } from "../service/bucket.js";
import { getAllMessagesByClassId } from "../service/message.js";

export async function deleteAllMessagesByClassId(
  userId: string,
  classId: string,
  ctx: Context
) {
  const messages = await getAllMessagesByClassId(classId, userId);

  if (!messages?.length) return;

  const attachments = messages.map((chat) => chat.attachments).flat();

  if (attachments.length) {
    const chatAttachmentsFilePath: string[] = attachments.map((file) =>
      extractMessagesFilePath(file)
    );
    await deleteFilesFromBucket(ctx, "messages", chatAttachmentsFilePath);
  }

  await db.delete(chat).where(eq(chat.classId, classId)).returning();
}
