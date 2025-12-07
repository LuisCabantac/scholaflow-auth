import { eq } from "drizzle-orm";
import type { Context } from "hono";

import { db } from "../../db/index.js";
import { note } from "../../db/schema.js";
import { getNoteByNoteIdUserId } from "../service/note.js";
import {
  arraysAreEqual,
  extractNoteFilePath,
  isBase64Attachment,
} from "../utils.js";
import {
  createNoteSchema,
  editNoteSchema,
  type CreateNote,
  type Note,
  type NoteAttachmentInput,
} from "../schema/index.js";
import {
  deleteFilesFromBucket,
  uploadAttachmentFromBase64,
  uploadAttachments,
} from "../service/bucket.js";

export async function createNote(
  ctx: Context,
  isPinned: boolean,
  noteBody: CreateNote
): Promise<void> {
  const { userId, title, content, attachments } = noteBody;

  const noteAttachments = Array.isArray(attachments)
    ? await Promise.all(
        (attachments as NoteAttachmentInput[]).map(async (attachment) => {
          if (isBase64Attachment(attachment)) {
            return await uploadAttachmentFromBase64(
              ctx,
              "notes",
              userId,
              attachment
            );
          } else if (
            attachment instanceof File &&
            attachment.name !== "undefined"
          ) {
            return await uploadAttachments(ctx, "notes", userId, attachment);
          } else if (typeof attachment === "string") {
            return attachment;
          } else {
            return null;
          }
        })
      ).then((results) => results.filter((url) => url !== null))
    : [];

  const newNote = {
    userId,
    title,
    content,
    attachments: noteAttachments,
    isPinned,
    updatedAt: null,
  };

  const result = createNoteSchema.safeParse(newNote);

  if (result.error) throw new Error(result.error.message);

  await db.insert(note).values(result.data);
}

export async function updateNote(
  isPinned: boolean,
  ctx: Context,
  curAttachments: string[],
  noteBody: Note,
  userId: string
) {
  const {
    id: noteId,
    userId: noteUserId,
    title,
    content,
    attachments,
  } = noteBody;

  const currentNote = await getNoteByNoteIdUserId(noteId, noteUserId);

  if (!currentNote)
    return {
      success: false,
      message: "Note doesn't exist.",
    };

  if (currentNote.userId !== userId)
    return {
      success: false,
      message: "Only the author who created this note can edit this.",
    };

  if (
    title !== currentNote.title ||
    content !== currentNote.content ||
    isPinned !== currentNote.isPinned ||
    attachments ||
    arraysAreEqual(curAttachments, currentNote.attachments ?? []) === false
  ) {
    const removedAttachments = currentNote.attachments.filter(
      (attachment) => !curAttachments.includes(attachment)
    );

    if (removedAttachments.length) {
      const filePath = removedAttachments.map((file) =>
        extractNoteFilePath(file)
      );
      await deleteFilesFromBucket(ctx, "notes", filePath);
    }

    const noteAttachments = Array.isArray(attachments)
      ? await Promise.all(
          (attachments as NoteAttachmentInput[]).map(async (attachment) => {
            if (isBase64Attachment(attachment)) {
              return await uploadAttachmentFromBase64(
                ctx,
                "notes",
                userId,
                attachment
              );
            } else if (
              attachment instanceof File &&
              attachment.name !== "undefined"
            ) {
              return await uploadAttachments(ctx, "notes", userId, attachment);
            } else if (typeof attachment === "string") {
              return attachment;
            } else {
              return null;
            }
          })
        ).then((results) => results.filter((url) => url !== null))
      : [];

    const updatedNote = {
      title,
      content,
      attachments: noteAttachments.concat(curAttachments),
      isPinned,
      updatedAt: new Date(),
    };

    const result = editNoteSchema.safeParse(updatedNote);

    if (result.error) throw new Error(result.error.message);

    await db.update(note).set(result.data).where(eq(note.id, noteId));
  }
}

export async function deleteNote(noteId: string, userId: string, ctx: Context) {
  const currentNote = await getNoteByNoteIdUserId(noteId, userId);

  if (!currentNote) throw new Error("Note doesn't exist.");

  if (currentNote.attachments.length) {
    const noteAttachmentsFilePath = currentNote.attachments.map((file) =>
      extractNoteFilePath(file)
    );
    await deleteFilesFromBucket(ctx, "notes", noteAttachmentsFilePath);
  }

  await db.delete(note).where(eq(note.id, noteId));
}
