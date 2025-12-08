import type { Context } from "hono";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { db } from "../../db/index.js";
import { getSupabase } from "../supabase-client.js";
import { classwork, user } from "../../db/schema.js";
import { extractClassworkFilePath } from "../utils.js";
import { getStreamByStreamId } from "../service/stream.js";
import { deleteFilesFromBucket } from "../service/bucket.js";
import { getClassroomByClassId } from "../service/classroom.js";
import { getAllClassworksByClassId } from "../service/classwork.js";
import { deleteAllNotificationsByResourceId } from "./notification.js";
import { getAllClassworksByClassAndUserId } from "../service/classwork.js";
import type { SubmitClasswork, UpdateClasswork } from "../schema/index.js";

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

export async function deleteAllClassworksByClassId(
  classId: string,
  ctx: Context
) {
  const classworks = await getAllClassworksByClassId(classId);

  if (!classworks || !classworks.length) return;

  const attachments = classworks
    .map((classwork) => classwork.attachments)
    .flat();

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
    .where(eq(classwork.classId, classId))
    .returning();

  if (data.length) {
    const classworkIds = data.map((classwork) => classwork.id);
    for (const id of classworkIds) {
      await deleteAllNotificationsByResourceId(id);
    }
  }
}

export async function submitClasswork(body: SubmitClasswork, ctx: Context) {
  const { classworkId, userId, submission, attachments } = body;

  const stream = await getStreamByStreamId(classworkId);
  if (!stream) throw new Error("Stream not found");

  const classroom = await getClassroomByClassId(stream.classId);
  if (!classroom) throw new Error("Classroom not found");

  const [userData] = await db.select().from(user).where(eq(user.id, userId));
  if (!userData) throw new Error("User not found");

  let attachmentUrls: string[] = [];

  if (attachments && attachments.length > 0) {
    attachmentUrls = await Promise.all(
      attachments.map(async (attachment) => {
        if (attachment.name !== "undefined") {
          const supabase = getSupabase(ctx);
          if (!supabase) throw new Error("Supabase client not available");

          const sanitizedFileName = attachment.name
            .replace(/~/g, "")
            .replace(/\s+/g, "_");
          const [name, extension] = sanitizedFileName.split(/\.(?=[^\.]+$)/);
          const fileName = `${name}_${uuidv4()}.${extension}`;

          const { data: uploadData, error } = await supabase.storage
            .from(`classworks/${stream.classId}`)
            .upload(fileName, attachment, {
              cacheControl: "3600",
              upsert: false,
            });

          if (error) throw new Error(error.message);

          const {
            data: { publicUrl },
          } = supabase.storage
            .from(`classworks/${stream.classId}`)
            .getPublicUrl(uploadData.path);

          return publicUrl;
        } else {
          return "";
        }
      })
    ).then((results) => results.filter((url) => url !== ""));
  }

  const data = await db
    .insert(classwork)
    .values({
      userId,
      userName: userData.name,
      userImage: userData.image,
      classId: stream.classId,
      className: classroom.name,
      streamId: classworkId,
      title: submission,
      attachments: attachmentUrls,
      links: [],
      isTurnedIn: true,
      turnedInDate: new Date(),
      streamCreatedAt: stream.createdAt,
    })
    .returning();

  if (!data.length) {
    throw new Error("Failed to submit classwork");
  }

  return data[0];
}

export async function updateClasswork(body: UpdateClasswork, ctx: Context) {
  const {
    classworkId,
    classroomId,
    streamId,
    attachments,
    curAttachments,
    curUrlLinks,
    links,
    isTurned,
  } = body;

  const existingClasswork = await db
    .select()
    .from(classwork)
    .where(eq(classwork.id, classworkId))
    .limit(1);

  if (!existingClasswork.length) {
    throw new Error("Classwork not found");
  }

  const currentClasswork = existingClasswork[0];

  if (
    curAttachments &&
    curAttachments.length < currentClasswork.attachments.length
  ) {
    const attachmentsToDelete = currentClasswork.attachments.filter(
      (att) => !curAttachments.includes(att)
    );
    if (attachmentsToDelete.length > 0) {
      const filePaths = attachmentsToDelete.map((file) =>
        extractClassworkFilePath(file)
      );
      await deleteFilesFromBucket(ctx, "classworks", filePaths);
    }
  }

  let newAttachmentUrls: string[] =
    curAttachments || currentClasswork.attachments;

  if (attachments && attachments.length > 0) {
    const uploadedUrls = await Promise.all(
      attachments.map(async (attachment) => {
        if (attachment.name !== "undefined") {
          const supabase = getSupabase(ctx);
          if (!supabase) throw new Error("Supabase client not available");

          const sanitizedFileName = attachment.name
            .replace(/~/g, "")
            .replace(/\s+/g, "_");
          const [name, extension] = sanitizedFileName.split(/\.(?=[^\.]+$)/);
          const fileName = `${name}_${uuidv4()}.${extension}`;

          const { data: uploadData, error } = await supabase.storage
            .from(`classworks/${classroomId}`)
            .upload(fileName, attachment, {
              cacheControl: "3600",
              upsert: false,
            });

          if (error) throw new Error(error.message);

          const {
            data: { publicUrl },
          } = supabase.storage
            .from(`classworks/${classroomId}`)
            .getPublicUrl(uploadData.path);

          return publicUrl;
        } else {
          return "";
        }
      })
    ).then((results) => results.filter((url) => url !== ""));

    newAttachmentUrls = [...newAttachmentUrls, ...uploadedUrls];
  }

  const updateData: Partial<typeof classwork.$inferInsert> = {
    attachments: newAttachmentUrls,
    links: links || currentClasswork.links,
  };

  if (isTurned !== undefined) {
    updateData.isTurnedIn = isTurned;
    if (isTurned) {
      updateData.turnedInDate = new Date();
    } else {
      updateData.turnedInDate = null;
    }
  }

  const data = await db
    .update(classwork)
    .set(updateData)
    .where(eq(classwork.id, classworkId))
    .returning();

  if (!data.length) {
    throw new Error("Failed to update classwork");
  }

  return data[0];
}

export async function deleteAllClassworkByStreamId(
  streamId: string,
  ctx: Context
) {
  const classworks = await db
    .select()
    .from(classwork)
    .where(eq(classwork.streamId, streamId));

  if (!classworks || !classworks.length) return;

  const attachments = classworks
    .map((classwork) => classwork.attachments)
    .flat();

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
    .where(eq(classwork.streamId, streamId))
    .returning();

  if (data.length) {
    const classworkIds = data.map((classwork) => classwork.id);
    for (const id of classworkIds) {
      await deleteAllNotificationsByResourceId(id);
    }
  }
}
