import type { Context } from "hono";
import { and, eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { classwork } from "../../db/schema.js";
import { extractClassworkFilePath } from "../utils.js";
import { deleteFilesFromBucket } from "../service/bucket.js";
import { deleteAllNotificationsByResourceId } from "./notification.js";
import { getAllClassworksByClassAndUserId } from "../service/classwork.js";

export async function deleteAllClassworkByClassAndUserId(
  classId: string,
  userId: string,
  ctx: Context
) {
  const classworks = await getAllClassworksByClassAndUserId(userId, classId);

  if (!classworks || !classworks.length) return;

  const attachments = classworks.map((chat) => chat.attachments).flat();

  if (attachments.length) {
    const classworkAttachmentsFilePath: string[] = attachments.map((file) =>
      extractClassworkFilePath(file)
    );
    await deleteFilesFromBucket(
      ctx,
      "classworks",
      classworkAttachmentsFilePath
    );
  }

  const data = await db
    .delete(classwork)
    .where(and(eq(classwork.userId, userId), eq(classwork.classId, classId)))
    .returning();

  if (data.length) {
    const classworkIds = data.map((classwork) => classwork.id);
    for (const id of classworkIds) {
      await deleteAllNotificationsByResourceId(id);
    }
  }
}
