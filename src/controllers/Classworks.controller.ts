import type { Context } from "hono";
import { desc, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { enrolledClass } from "../db/schema.js";
import { type Stream } from "../lib/schema/index.js";
import { validateSession } from "../lib/auth/index.js";
import { getAllStreamsByClassId } from "../lib/service/stream.js";
import { getAllClassworksByUserId } from "../lib/service/classwork.js";

export async function getClassworkToDoSummary(ctx: Context) {
  try {
    const userId = ctx.req.param("userId");

    if (!userId) {
      return ctx.json({
        message: "Id parameter is required",
        error: "Bad Request",
        statusCode: 400,
      });
    }

    const { isValidSession } = await validateSession(ctx);

    if (!isValidSession) {
      return ctx.json({
        message: "Invalid or expired token",
        error: "Unauthorized",
        statusCode: 401,
      });
    }

    const enrolledClasses = await db
      .select()
      .from(enrolledClass)
      .where(eq(enrolledClass.userId, userId))
      .orderBy(desc(enrolledClass.createdAt));

    const enrolledClassworks = (
      Array.isArray(enrolledClasses)
        ? await Promise.all(
            enrolledClasses.map(
              async (enrolledClass) =>
                await getAllStreamsByClassId(enrolledClass.classId)
            )
          )
        : []
    )
      .filter((array): array is Stream[] => array !== null)
      .flat();

    const classworks = await getAllClassworksByUserId(userId);

    const assigned = enrolledClassworks
      ?.filter(
        (classwork) =>
          !classworks
            ?.map((turnedIn) => turnedIn.streamId)
            .includes(classwork.id) &&
          (!classwork.dueDate ||
            (classwork.dueDate &&
              new Date(classwork.dueDate ?? "") > new Date())) &&
          (classwork.announceToAll ||
            (classwork.announceTo && classwork.announceTo.includes(userId))) &&
          (classwork.scheduledAt
            ? new Date(classwork.scheduledAt) < new Date()
            : true)
      )
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);
        return dateB.getTime() - dateA.getTime();
      });

    const missing = enrolledClassworks
      ?.filter(
        (classwork) =>
          !classworks?.some(
            (turnedIn) =>
              turnedIn.streamId === classwork.id && turnedIn.isTurnedIn
          ) &&
          classwork.dueDate &&
          new Date(classwork.dueDate ?? "") < new Date() &&
          (classwork.announceToAll ||
            (classwork.announceTo && classwork.announceTo.includes(userId))) &&
          (classwork.scheduledAt
            ? new Date(classwork.scheduledAt) < new Date()
            : true)
      )
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);
        return dateB.getTime() - dateA.getTime();
      });

    const done = classworks
      ?.filter(
        (classwork) =>
          (classwork.isTurnedIn || classwork.isGraded) &&
          enrolledClasses
            ?.map((enrolledClass) => enrolledClass.classId)
            .includes(classwork.classId)
      )
      .sort((a, b) => {
        const dateA = new Date(a.turnedInDate ?? 0);
        const dateB = new Date(b.turnedInDate ?? 0);
        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);
        return dateB.getTime() - dateA.getTime();
      });

    return ctx.json({
      message: "Classwork summary retrieved successfully",
      statusCode: 200,
      data: {
        assigned,
        missing,
        done,
      },
      error: null,
    });
  } catch (error) {
    return ctx.json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve classwork summary",
      error: "Internal Server Error",
      statusCode: 500,
    });
  }
}
