import { and, desc, eq, ilike } from "drizzle-orm";

import { db } from "../../db/index.js";
import { note } from "../../db/schema.js";
import type { Note } from "../schema/index.js";

export async function getAllNotesByUserId(
  userId: string
): Promise<Note[] | null> {
  const data = await db
    .select()
    .from(note)
    .where(eq(note.userId, userId))
    .orderBy(desc(note.createdAt));

  return !data?.length ? null : data;
}

export async function getNoteByNoteIdUserId(
  noteId: string,
  userId: string
): Promise<Note | null> {
  const [data] = await db
    .select()
    .from(note)
    .where(and(eq(note.userId, userId), eq(note.id, noteId)));

  return data || null;
}

export async function getAllNotesByUserIdQuery(
  query: string,
  userId: string
): Promise<Note[] | null> {
  const data = await db
    .select()
    .from(note)
    .where(and(eq(note.userId, userId), ilike(note.title, `%${query}%`)))
    .orderBy(desc(note.createdAt));

  return !data?.length ? null : data;
}
