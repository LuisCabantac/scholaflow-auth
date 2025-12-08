import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { v4 as uuidv4 } from "uuid";

import { db } from "../../db/index.js";
import { stream } from "../../db/schema.js";
import { extractStreamFilePath } from "../utils.js";
import { getSupabase } from "../supabase-client.js";
import { sendNotification } from "./notification.js";
import { getClassTopicByTopicId } from "../service/topic.js";
import { deleteFilesFromBucket } from "../service/bucket.js";
import { deleteAllClassworkByStreamId } from "./classwork.js";
import { getClassroomByClassId } from "../service/classroom.js";
import {
  deleteAllClassStreamCommentsByStreamId,
  deleteAllPrivateStreamCommentsByStreamId,
} from "./comment.js";
import {
  streamInsertSchema,
  editStreamSchema,
  type CreateStream,
  type UpdateStream,
  type DeleteStream,
} from "../schema/index.js";

export async function deleteAllStreamsByClassId(classId: string, ctx: Context) {
  const streams = await db
    .select()
    .from(stream)
    .where(eq(stream.classId, classId));

  if (!streams?.length) return;

  const attachments = streams.map((s) => s.attachments).flat();

  if (attachments.length) {
    const streamAttachmentsFilePath: string[] = attachments.map((file) =>
      extractStreamFilePath(file)
    );
    await deleteFilesFromBucket(ctx, "streams", streamAttachmentsFilePath);
  }

  await db.delete(stream).where(eq(stream.classId, classId));
}

export async function createClassStreamPost(
  body: CreateStream,
  audience: string[],
  audienceIsAll: boolean,
  userId: string,
  userName: string,
  userImage: string,
  ctx: Context
) {
  const classroom = await getClassroomByClassId(body.classroomId);

  if (!classroom) throw new Error("This class doesn't exist.");

  if (classroom.teacherId !== userId && !classroom.allowUsersToPost)
    throw new Error("Students are not allowed to post to the class.");

  const postAttachments = body.attachments
    ? await Promise.all(
        body.attachments.map(async (attachment) => {
          if (attachment.name !== "undefined") {
            const supabase = getSupabase(ctx);
            if (!supabase) throw new Error("Supabase client not available");

            const sanitizedFileName = attachment.name
              .replace(/~/g, "")
              .replace(/\s+/g, "_");
            const [name, extension] = sanitizedFileName.split(/\.(?=[^\.]+$)/);
            const fileName = `${name}_${uuidv4()}.${extension}`;

            const { data: uploadData, error } = await supabase.storage
              .from(`streams/${body.classroomId}`)
              .upload(fileName, attachment, {
                cacheControl: "3600",
                upsert: false,
              });

            if (error) throw new Error(error.message);

            const {
              data: { publicUrl },
            } = supabase.storage
              .from(`streams/${body.classroomId}`)
              .getPublicUrl(uploadData.path);

            return publicUrl;
          } else {
            return null;
          }
        })
      ).then((results) => results.filter((url): url is string => url !== null))
    : [];

  const topicId = body.topicId;
  const finalTopicId = topicId === "no-topic" ? null : topicId;

  const topic = finalTopicId
    ? await getClassTopicByTopicId(finalTopicId)
    : null;

  const newStream = {
    userId,
    userName,
    userImage,
    type: body.streamType,
    title: body.title,
    content: body.caption,
    classId: body.classroomId,
    className: classroom.name,
    announceTo: body.announceTo ?? [],
    announceToAll: audienceIsAll,
    attachments: postAttachments,
    links: body.links ?? [],
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    acceptingSubmissions: body.acceptingSubmissions ?? true,
    closeSubmissionsAfterDueDate: body.closeSubmissionsAfterDueDate ?? false,
    points: body.totalPoints ?? null,
    topicId: topic?.id ?? null,
    topicName: topic?.name ?? null,
  };

  const result = streamInsertSchema.safeParse(newStream);
  if (result.error) {
    throw new Error(
      "Invalid post data provided. Please check all required fields and try again."
    );
  }

  const [data] = await db.insert(stream).values(result.data).returning();
  if (!data)
    throw new Error(
      "Failed to publish post. Please check your connection and try again, or contact support if the issue persists."
    );

  await sendNotification(
    data.type as any,
    userId,
    userName,
    userImage,
    audience,
    data.id,
    data.title ?? data.content ?? "",
    `/classroom/class/${data.classId}/stream/${data.id}`
  );

  return data;
}

export async function updateClassStreamPost(
  body: UpdateStream,
  audience: string[],
  audienceIsAll: boolean,
  userId: string,
  userName: string,
  userImage: string,
  ctx: Context
) {
  const currentStream = await db
    .select()
    .from(stream)
    .where(eq(stream.id, body.streamId))
    .then(([s]) => s);

  if (!currentStream) throw new Error("This post doesn't exist in this class.");

  if (currentStream.userId !== userId)
    throw new Error(
      "This class stream can only be edited by the one who posted it."
    );

  const removedAttachments = currentStream.attachments.filter(
    (attachment) => !body.curAttachments?.includes(attachment)
  );
  if (removedAttachments.length) {
    const filePath = removedAttachments.map((file) =>
      extractStreamFilePath(file)
    );
    await deleteFilesFromBucket(ctx, "streams", filePath);
  }

  const postAttachments = body.attachments
    ? await Promise.all(
        body.attachments.map(async (attachment) => {
          if (attachment.name !== "undefined" && attachment.size > 0) {
            const supabase = getSupabase(ctx);
            if (!supabase) throw new Error("Supabase client not available");

            const sanitizedFileName = attachment.name
              .replace(/~/g, "")
              .replace(/\s+/g, "_");
            const [name, extension] = sanitizedFileName.split(/\.(?=[^\.]+$)/);
            const fileName = `${name}_${uuidv4()}.${extension}`;

            const { data: uploadData, error } = await supabase.storage
              .from(`streams/${body.classroomId}`)
              .upload(fileName, attachment, {
                cacheControl: "3600",
                upsert: false,
              });

            if (error) throw new Error(error.message);

            const {
              data: { publicUrl },
            } = supabase.storage
              .from(`streams/${body.classroomId}`)
              .getPublicUrl(uploadData.path);

            return publicUrl;
          } else {
            return null;
          }
        })
      ).then((results) => results.filter((url): url is string => url !== null))
    : [];

  const topic = body.topicId
    ? await getClassTopicByTopicId(body.topicId)
    : null;

  const updatedStream = {
    title: body.title,
    content: body.caption,
    announceTo: audience,
    announceToAll: audienceIsAll,
    attachments: postAttachments.concat(body.curAttachments ?? []),
    links: body.links?.concat(body.curUrlLinks ?? []),
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    points: body.totalPoints ?? null,
    acceptingSubmissions:
      body.acceptingSubmissions ?? currentStream.acceptingSubmissions,
    closeSubmissionsAfterDueDate:
      body.closeSubmissionsAfterDueDate ??
      currentStream.closeSubmissionsAfterDueDate,
    topicId: topic?.id ?? null,
    topicName: topic?.name ?? null,
    updatedAt: new Date(),
  };

  const result = editStreamSchema.safeParse(updatedStream);

  if (result.error) {
    throw new Error(
      "Invalid data provided for stream update. Please check your input and try again."
    );
  }

  const [data] = await db
    .update(stream)
    .set(result.data)
    .where(eq(stream.id, body.streamId))
    .returning();

  if (!data) {
    throw new Error(
      "Failed to update the post. Please check your connection and try again, or contact support if the issue persists."
    );
  }

  return data;
}

export async function deleteClassStreamPost(
  body: DeleteStream,
  userId: string,
  ctx: Context
) {
  const currentStream = await db
    .select()
    .from(stream)
    .where(eq(stream.id, body.streamId))
    .then(([s]) => s);

  if (!currentStream) throw new Error("This post doesn't exist in this class.");

  const classroom = await getClassroomByClassId(currentStream.classId);

  if (!classroom) throw new Error("This class doesn't exist.");

  if (!(currentStream.userId === userId || classroom.teacherId === userId))
    throw new Error("You're not authorized to delete this post.");

  await deleteAllClassStreamCommentsByStreamId(body.streamId, ctx);
  await deleteAllPrivateStreamCommentsByStreamId(body.streamId, ctx);

  await deleteAllClassworkByStreamId(body.streamId, ctx);

  if (currentStream.attachments.length) {
    const streamAttachmentsFilePath = currentStream.attachments.map((file) =>
      extractStreamFilePath(file)
    );
    await deleteFilesFromBucket(ctx, "streams", streamAttachmentsFilePath);
  }

  await db.delete(stream).where(eq(stream.id, body.streamId));

  return;
}
