import type { Context } from "hono";
import { between, desc, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { generateClassCode } from "../lib/utils.js";
import { validateSession } from "../lib/auth/index.js";
import { validateId } from "../lib/validation/index.js";
import { classroom, enrolledClass } from "../db/schema.js";
import { classroomType, createClassroomSchema } from "../lib/schema/index.js";
import {
  getAllEnrolledClassesByClassId,
  updateEnrolledClass,
} from "../lib/service/classroom.js";

export async function getAllClasses(ctx: Context) {
  try {
    const userId = ctx.req.param("userId");
    const classType = ctx.req.query("type");

    if (!userId) {
      return ctx.json({
        message: "Id parameter is required",
        error: "Bad Request",
        statusCode: 400,
      });
    }

    if (!classType) {
      return ctx.json({
        message: "Class type parameter is required",
        error: "Bad Request",
        statusCode: 400,
      });
    }

    const isValidClassType = classroomType.safeParse(classType);

    if (isValidClassType.error) {
      return ctx.json({
        message: "Invalid class type",
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

    if (isValidClassType.data === "created") {
      const data = await db
        .select()
        .from(classroom)
        .where(eq(classroom.teacherId, userId))
        .orderBy(desc(classroom.createdAt));

      if (!data.length) {
        return ctx.json({
          message: "No classes found",
          data: null,
          statusCode: 200,
        });
      }

      return ctx.json({ message: "Classes found", data, statusCode: 200 });
    }

    if (isValidClassType.data === "enrolled") {
      const data = await db
        .select()
        .from(enrolledClass)
        .where(eq(enrolledClass.userId, userId))
        .orderBy(desc(enrolledClass.createdAt));

      if (!data.length) {
        return ctx.json({
          message: "No classes found",
          data: null,
          statusCode: 200,
        });
      }

      return ctx.json({ message: "Classes found", data, statusCode: 200 });
    }
  } catch (error) {
    return ctx.json({
      message:
        error instanceof Error
          ? error.message
          : "There was an error retrieving the classrooms data",
      error: "Internal Server Error",
      statusCode: 500,
    });
  }
}

export async function getClassByClassId(ctx: Context) {
  try {
    const classId = ctx.req.param("classId");

    if (!classId) {
      return ctx.json({
        message: "Id parameter is required",
        error: "Bad Request",
        statusCode: 400,
      });
    }

    const { isValidId } = validateId(classId, "uuid");

    if (!isValidId) {
      return ctx.json({
        message: "Invalid class ID format",
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

    const [data] = await db
      .select()
      .from(classroom)
      .where(eq(classroom.id, classId));

    if (!data) {
      return ctx.json({
        message: "No class found",
        data: null,
        statusCode: 200,
      });
    }

    return ctx.json({ message: "Class found", data, statusCode: 200 });
  } catch (error) {
    return ctx.json({
      message:
        error instanceof Error
          ? error.message
          : "There was an error retrieving the classroom data",
      error: "Internal Server Error",
      statusCode: 500,
    });
  }
}

export async function createClassroom(ctx: Context) {
  try {
    const body = await ctx.req.json();

    const { isValidSession, userId } = await validateSession(ctx);

    if (!isValidSession) {
      return ctx.json({
        message: "Invalid or expired token",
        error: "Unauthorized",
        statusCode: 401,
      });
    }

    const {
      name,
      subject,
      section,
      cardBackground,
      teacherId,
      teacherName,
      teacherImage,
    } = body;

    const newClass = {
      name,
      subject,
      section,
      cardBackground,
      illustrationIndex: Math.floor(Math.random() * 5),
      code: generateClassCode(),
      teacherId,
      teacherName,
      teacherImage,
    };

    if (!body || Object.keys(body).length === 0) {
      return ctx.json({
        message: "Request body is required",
        error: "Bad Request",
        statusCode: 400,
      });
    }

    const isValidClassroomSchema = createClassroomSchema.safeParse(newClass);

    if (isValidClassroomSchema.error) {
      return ctx.json({
        message: isValidClassroomSchema.error.issues
          .map((issue) => issue.message)
          .join(", "),
        error: "Bad Request",
        statusCode: 400,
      });
    }

    if (teacherId !== userId) {
      return ctx.json({
        message:
          "You are not authorized to create a classroom for another teacher",
        error: "Forbidden",
        statusCode: 403,
      });
    }

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const classroomsCreatedToday = await db
      .select()
      .from(classroom)
      .where(between(classroom.createdAt, startOfToday, endOfToday));

    const MAX_CLASSROOMS_PER_DAY = 10;

    if (classroomsCreatedToday.length >= MAX_CLASSROOMS_PER_DAY) {
      return ctx.json({
        message: "Daily classroom creation limit reached",
        error: "Too Many Requests",
        statusCode: 429,
      });
    }

    const [data] = await db
      .insert(classroom)
      .values(isValidClassroomSchema.data)
      .returning({ id: classroom.id });

    if (!data) {
      return ctx.json({
        message: "Failed to create classroom. Database operation unsuccessful",
        error: "Internal Server Error",
        statusCode: 500,
      });
    }

    return ctx.json({
      message: "Classroom created successfully",
      data: `/classroom/class/${data.id}`,
      statusCode: 201,
    });
  } catch (error) {
    return ctx.json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to create classroom. Please try again",
      error: "Internal Server Error",
      statusCode: 500,
    });
  }
}

export async function updateClassroom(ctx: Context) {
  try {
    const { isValidSession, userId, userData } = await validateSession(ctx);

    if (!isValidSession) {
      return ctx.json({
        message: "Invalid or expired token",
        error: "Unauthorized",
        statusCode: 401,
      });
    }

    const classId = ctx.req.param("classId");

    if (!classId) {
      return ctx.json({
        message: "Class ID parameter is required",
        error: "Bad Request",
        statusCode: 400,
      });
    }

    const [currentClassData] = await db
      .select()
      .from(classroom)
      .where(eq(classroom.id, classId));

    if (!currentClassData) {
      return ctx.json({
        message: "Classroom not found",
        error: "Not Found",
        statusCode: 404,
      });
    }

    if (userId !== currentClassData.teacherId) {
      return ctx.json({
        message: "You are not authorized to update this classroom",
        error: "Forbidden",
        statusCode: 403,
      });
    }

    const body = await ctx.req.json();

    if (!body || Object.keys(body).length === 0) {
      return ctx.json({
        message: "Request body is required",
        error: "Bad Request",
        statusCode: 400,
      });
    }

    const {
      name,
      subject,
      section,
      classDescription,
      cardBackground,
      allowStudentsToComment,
      allowStudentsToPost,
      updateClassCode,
    } = body;

    const newClass = {
      name,
      subject,
      section,
      classDescription,
      cardBackground,
      allowStudentsToComment,
      allowStudentsToPost,
      updateClassCode,
    };

    if (
      updateClassCode ||
      currentClassData.name !== newClass.name ||
      currentClassData.subject !== newClass.subject ||
      currentClassData.teacherName !== userData.name ||
      currentClassData.teacherImage !== userData.image ||
      currentClassData.description !== newClass.classDescription ||
      currentClassData.section !== newClass.section ||
      currentClassData.cardBackground !== newClass.cardBackground ||
      currentClassData.allowUsersToComment !==
        newClass.allowStudentsToComment ||
      currentClassData.allowUsersToPost !== newClass.allowStudentsToPost
    ) {
      const updatedClassData = {
        name: newClass.name,
        subject: newClass.subject,
        section: newClass.section ?? "",
        description: newClass.classDescription ?? "",
        teacherName: userData.name,
        teacherImage: userData.image as string,
        allowUsersToComment: newClass.allowStudentsToComment,
        allowUsersToPost: newClass.allowStudentsToPost,
        cardBackground: newClass.cardBackground,
        code: updateClassCode ? generateClassCode() : currentClassData.code,
      };

      const enrolledClasses = await getAllEnrolledClassesByClassId(classId);

      if (enrolledClasses?.length) {
        for (const enrolledClass of enrolledClasses) {
          await updateEnrolledClass(enrolledClass.id, {
            teacherName: userData.name,
            teacherImage: userData.image ?? "",
            name: newClass.name,
            subject: newClass.subject,
            section: newClass.section,
            cardBackground: newClass.cardBackground,
          });
        }
      }

      const result = createClassroomSchema.safeParse({
        ...currentClassData,
        ...updatedClassData,
      });

      if (result.error) {
        return ctx.json({
          message: result.error.issues.map((issue) => issue.message).join(", "),
          error: "Bad Request",
          statusCode: 400,
        });
      }

      const [data] = await db
        .update(classroom)
        .set(updatedClassData)
        .where(eq(classroom.id, classId))
        .returning();

      if (!data) {
        return ctx.json({
          message:
            "Failed to update classroom. Database operation unsuccessful",
          error: "Internal Server Error",
          statusCode: 500,
        });
      }

      return ctx.json({
        message: "Classroom updated successfully",
        data: `/classroom/class/${data.id}`,
        statusCode: 201,
      });
    }

    return ctx.json({
      message: "No changes were made to the classroom",
      data: `/classroom/class/${currentClassData.id}`,
      statusCode: 200,
    });
  } catch (error) {
    return ctx.json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to update classroom. Please try again",
      error: "Internal Server Error",
      statusCode: 500,
    });
  }
}
