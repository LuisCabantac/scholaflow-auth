import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { v4 as uuidv4 } from "uuid";

import { db } from "../../db/index.js";
import { extractCommentFilePath } from "../utils.js";
import { getSupabase } from "../supabase-client.js";
import { getStreamByStreamId } from "../service/stream.js";
import { deleteFilesFromBucket } from "../service/bucket.js";
import { deleteAllNotificationsByResourceId } from "./notification.js";
import type { AddComment, AddPrivateComment } from "../schema/index.js";
import { streamComment, streamPrivateComment } from "../../db/schema.js";
import {
  getAllCommentsByUserId,
  getAllPrivateCommentsByUserId,
} from "../service/comment.js";

export async function deleteAllCommentsByClassId(
  classId: string,
  ctx: Context
) {
  const comments = await db
    .select()
    .from(streamComment)
    .where(eq(streamComment.classId, classId));

  if (comments?.length) {
    const attachments = comments
      .map((comment) => comment.attachment)
      .filter((attachment) => attachment !== null);

    if (attachments.length) {
      const commentAttachmentsFilePath: string[] = attachments.map((file) =>
        extractCommentFilePath(file)
      );
      await deleteFilesFromBucket(ctx, "comments", commentAttachmentsFilePath);
    }

    const data = await db
      .delete(streamComment)
      .where(eq(streamComment.classId, classId))
      .returning();

    if (data.length) {
      const commentIds = data.map((comment) => comment.id);
      for (const id of commentIds) {
        await deleteAllNotificationsByResourceId(id);
      }
    }
  }

  const privateComments = await db
    .select()
    .from(streamPrivateComment)
    .where(eq(streamPrivateComment.classId, classId));

  if (privateComments?.length) {
    const attachments = privateComments
      .map((comment) => comment.attachment)
      .filter((attachment) => attachment !== null);

    if (attachments.length) {
      const commentAttachmentsFilePath: string[] = attachments.map((file) =>
        extractCommentFilePath(file)
      );
      await deleteFilesFromBucket(ctx, "comments", commentAttachmentsFilePath);
    }

    const data = await db
      .delete(streamPrivateComment)
      .where(eq(streamPrivateComment.classId, classId))
      .returning();

    if (data.length) {
      const commentIds = data.map((comment) => comment.id);
      for (const id of commentIds) {
        await deleteAllNotificationsByResourceId(id);
      }
    }
  }
}

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

export async function deleteAllClassStreamCommentsByStreamId(
  streamId: string,
  ctx: Context
) {
  const comments = await db
    .select()
    .from(streamComment)
    .where(eq(streamComment.streamId, streamId));

  if (!comments?.length) return;

  const attachments = comments
    .map((comment) => comment.attachment)
    .filter((attachment) => attachment !== null);
  if (attachments.length) {
    const filePath = attachments.map((file) => extractCommentFilePath(file));
    await deleteFilesFromBucket(ctx, "comments", filePath);
  }

  await db.delete(streamComment).where(eq(streamComment.streamId, streamId));
}

export async function deleteAllPrivateStreamCommentsByStreamId(
  streamId: string,
  ctx: Context
) {
  const privateComments = await db
    .select()
    .from(streamPrivateComment)
    .where(eq(streamPrivateComment.streamId, streamId));

  if (!privateComments?.length) return;

  const attachments = privateComments
    .map((comment) => comment.attachment)
    .filter((attachment) => attachment !== null);

  if (attachments.length) {
    const filePath = attachments.map((file) => extractCommentFilePath(file));
    await deleteFilesFromBucket(ctx, "comments", filePath);
  }

  await db
    .delete(streamPrivateComment)
    .where(eq(streamPrivateComment.streamId, streamId));
}

export async function addCommentToStream(
  body: AddComment,
  userId: string,
  userName: string,
  userImage: string,
  ctx: Context
) {
  const { classroomId, streamId, comment, attachment } = body;

  const stream = await getStreamByStreamId(streamId);
  if (!stream) throw new Error("Stream not found");

  let attachmentUrl: string | null = null;

  if (attachment) {
    const supabase = getSupabase(ctx);
    if (!supabase) throw new Error("Supabase client not available");

    const sanitizedFileName = attachment.name
      .replace(/~/g, "")
      .replace(/\s+/g, "_");
    const [name, extension] = sanitizedFileName.split(/\.(?=[^\.]+$)/);
    const fileName = `${name}_${uuidv4()}.${extension}`;

    const { data: uploadData, error } = await supabase.storage
      .from(`comments/${classroomId}`)
      .upload(fileName, attachment, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw new Error(error.message);

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(`comments/${classroomId}`)
      .getPublicUrl(uploadData.path);

    attachmentUrl = publicUrl;
  }

  const data = await db
    .insert(streamComment)
    .values({
      streamId,
      classId: classroomId,
      userId,
      userName,
      userImage,
      content: comment,
      attachment: attachmentUrl,
    })
    .returning();

  if (!data.length) {
    throw new Error("Failed to add comment");
  }

  return data[0];
}

export async function addPrivateCommentToStream(
  body: AddPrivateComment,
  userName: string,
  userImage: string,
  ctx: Context
) {
  const { classroomId, streamId, userId, comment, attachment } = body;

  const stream = await getStreamByStreamId(streamId);
  if (!stream) throw new Error("Stream not found");

  let attachmentUrl: string | null = null;

  if (attachment) {
    const supabase = getSupabase(ctx);
    if (!supabase) throw new Error("Supabase client not available");

    const sanitizedFileName = attachment.name
      .replace(/~/g, "")
      .replace(/\s+/g, "_");
    const [name, extension] = sanitizedFileName.split(/\.(?=[^\.]+$)/);
    const fileName = `${name}_${uuidv4()}.${extension}`;

    const { data: uploadData, error } = await supabase.storage
      .from(`comments/${classroomId}`)
      .upload(fileName, attachment, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw new Error(error.message);

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(`comments/${classroomId}`)
      .getPublicUrl(uploadData.path);

    attachmentUrl = publicUrl;
  }

  const data = await db
    .insert(streamPrivateComment)
    .values({
      streamId,
      classId: classroomId,
      userId,
      userName,
      userImage,
      content: comment,
      attachment: attachmentUrl,
      toUserId: userId,
    })
    .returning();

  if (!data.length) {
    throw new Error("Failed to add private comment");
  }

  return data[0];
}
