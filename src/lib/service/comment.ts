import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { streamComment, streamPrivateComment } from "../../db/schema.js";
import type { StreamComment, StreamPrivateComment } from "../schema/index.js";

export async function getAllCommentsByStreamId(
  streamId: string
): Promise<StreamComment[] | null> {
  const data = await db
    .select()
    .from(streamComment)
    .where(eq(streamComment.streamId, streamId));

  return !data?.length ? null : data;
}

export async function getAllCommentsByUserId(
  userId: string
): Promise<StreamComment[] | null> {
  const data = await db
    .select()
    .from(streamComment)
    .where(eq(streamComment.userId, userId));

  return !data?.length ? null : data;
}

export async function getStreamCommentByCommentId(
  commentId: string
): Promise<StreamComment | null> {
  const [data] = await db
    .select()
    .from(streamComment)
    .where(eq(streamComment.id, commentId));

  return data || null;
}

export async function getAllPrivateCommentsByStreamId(
  streamId: string
): Promise<StreamPrivateComment[] | null> {
  const data = await db
    .select()
    .from(streamPrivateComment)
    .where(eq(streamPrivateComment.streamId, streamId));

  return !data?.length ? null : data;
}

export async function getAllPrivateCommentsByUserId(
  userId: string
): Promise<StreamPrivateComment[] | null> {
  const data = await db
    .select()
    .from(streamPrivateComment)
    .where(eq(streamPrivateComment.userId, userId));

  return !data?.length ? null : data;
}

export async function getStreamPrivateCommentByCommentId(
  commentId: string
): Promise<StreamPrivateComment | null> {
  const [data] = await db
    .select()
    .from(streamPrivateComment)
    .where(eq(streamPrivateComment.id, commentId));

  return data || null;
}
