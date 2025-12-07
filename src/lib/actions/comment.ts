import { eq } from "drizzle-orm";
import type { Context } from "hono";

import { db } from "../../db/index.js";
import { extractCommentFilePath } from "../utils.js";
import { deleteFilesFromBucket } from "../service/bucket.js";
import { deleteAllNotificationsByResourceId } from "./notification.js";
import { streamComment, streamPrivateComment } from "../../db/schema.js";
import {
  getAllCommentsByUserId,
  getAllPrivateCommentsByUserId,
} from "../service/comment.js";

export async function deleteAllCommentsByUserId(userId: string, ctx: Context) {
  const comments = await getAllCommentsByUserId(userId);

  if (!comments || !comments.length) return;

  const attachments = comments
    .map((comment) => comment.attachment)
    .filter((attachment) => attachment !== null);

  if (attachments.length) {
    const chatAttachmentsFilePath: string[] = attachments.map((file) =>
      extractCommentFilePath(file)
    );
    await deleteFilesFromBucket(ctx, "comments", chatAttachmentsFilePath);
  }

  const data = await db
    .delete(streamComment)
    .where(eq(streamComment.userId, userId))
    .returning();

  if (data.length) {
    const commentIds = data.map((comment) => comment.id);
    for (const id of commentIds) {
      await deleteAllNotificationsByResourceId(id);
    }
  }
}

export async function deleteAllPrivateCommentsByUserId(
  userId: string,
  ctx: Context
) {
  const comments = await getAllPrivateCommentsByUserId(userId);

  if (!comments || !comments.length) return;

  const attachments = comments
    .map((comment) => comment.attachment)
    .filter((attachment) => attachment !== null);

  if (attachments.length) {
    const chatAttachmentsFilePath: string[] = attachments.map((file) =>
      extractCommentFilePath(file)
    );
    await deleteFilesFromBucket(ctx, "comments", chatAttachmentsFilePath);
  }

  const data = await db
    .delete(streamPrivateComment)
    .where(eq(streamPrivateComment.userId, userId))
    .returning();

  if (data.length) {
    const commentIds = data.map((comment) => comment.id);
    for (const id of commentIds) {
      await deleteAllNotificationsByResourceId(id);
    }
  }
}
