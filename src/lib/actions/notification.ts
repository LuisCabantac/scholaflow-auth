import { and, eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { notification } from "../../db/schema.js";
import type { NotificationType } from "../schema/index.js";
import { getNotificationByUserAndNotificationId } from "../service/notification.js";

export async function sendNotification(
  type: NotificationType,
  fromUserId: string,
  fromUserName: string,
  fromUserImage: string,
  toUserId: string | string[],
  resourceId: string,
  resourceContent: string,
  resourceUrl: string
): Promise<void> {
  if (
    Array.isArray(toUserId) &&
    toUserId.every((id) => typeof id === "string") &&
    (type === "stream" ||
      type === "assignment" ||
      type === "quiz" ||
      type === "question" ||
      type === "material")
  ) {
    if (!toUserId.length) return;

    const newNotifications = toUserId.map((userId) => {
      return {
        userId,
        type: type,
        fromUserName: fromUserId,
        fromUserImage: fromUserImage,
        resourceId,
        resourceContent,
        resourceUrl,
      };
    });

    await db.insert(notification).values(newNotifications);

    return;
  }

  const newNotification = {
    userId: toUserId as string,
    type: type,
    fromUserName,
    fromUserImage,
    resourceId,
    resourceContent,
    resourceUrl,
  };

  await db.insert(notification).values(newNotification);
}

export async function readUnreadNotification(
  userId: string,
  notificationId: string
) {
  const existingNotification = await getNotificationByUserAndNotificationId(
    userId,
    notificationId
  );

  if (!existingNotification) return;

  await db
    .update(notification)
    .set({ isRead: !existingNotification.isRead })
    .where(eq(notification.id, notificationId));
}

export async function deleteAllNotificationsByUserId(userId: string) {
  await db.delete(notification).where(eq(notification.userId, userId));
}

export async function deleteAllNotificationsByResourceId(resourceId: string) {
  await db.delete(notification).where(eq(notification.resourceId, resourceId));
}

export async function deleteAllNotificationsByUserAndResourceId(
  userId: string,
  resourceId: string
) {
  await db
    .delete(notification)
    .where(
      and(
        eq(notification.userId, userId),
        eq(notification.resourceId, resourceId)
      )
    );
}

export async function markAllAsReadNotificationsByUserId(userId: string) {
  await db
    .update(notification)
    .set({ isRead: true })
    .where(eq(notification.userId, userId));
}
