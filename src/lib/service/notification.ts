import { and, desc, eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { notification } from "../../db/schema.js";
import type { Notification } from "../schema/index.js";

export async function getAllNotificationByUserId(
  userId: string
): Promise<Notification[] | null> {
  const data = await db
    .select()
    .from(notification)
    .where(eq(notification.userId, userId))
    .orderBy(desc(notification.createdAt));

  return !data?.length ? null : data;
}

export async function getAllUnreadNotificationByUserId(
  userId: string
): Promise<Notification[] | null> {
  const data = await db
    .select()
    .from(notification)
    .where(
      and(eq(notification.userId, userId), eq(notification.isRead, false))
    );

  return !data?.length ? null : data;
}

export async function getNotificationByUserAndNotificationId(
  userId: string,
  notificationId: string
): Promise<Notification | null> {
  const [data] = await db
    .select()
    .from(notification)
    .where(
      and(eq(notification.userId, userId), eq(notification.id, notificationId))
    );

  return !data ? null : data;
}
