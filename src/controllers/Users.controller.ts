import { eq } from "drizzle-orm";
import type { Context } from "hono";

import { db } from "../db/index.js";
import { user } from "../db/schema.js";
import { emailSchema } from "../lib/schema/index.js";
import { validateSession } from "../lib/auth/index.js";

export async function getUserByEmail(ctx: Context) {
  try {
    const email = ctx.req.query("email");

    if (!email) {
      return ctx.json({
        message: "Email parameter is required",
        error: "Bad Request",
        statusCode: 400,
      });
    }

    const isValidEmail = emailSchema.safeParse(email);

    if (isValidEmail.error) {
      return ctx.json({
        message: "Invalid email format",
        error: "Bad Request",
        statusCode: 400,
        details: isValidEmail.error.issues,
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
      .from(user)
      .where(eq(user.email, isValidEmail.data));

    if (!data) {
      return ctx.json({
        message: "User not found",
        error: "Not Found",
        statusCode: 404,
      });
    }

    return ctx.json({ message: "User found", data, statusCode: 200 });
  } catch (error) {
    return ctx.json({
      message:
        error instanceof Error
          ? error.message
          : "There was an error retrieving the users data.",
      error: "Internal Server Error",
      statusCode: 500,
    });
  }
}

export async function getUserById(ctx: Context) {
  try {
    const userId = ctx.req.param("userId");

    if (!userId) {
      return ctx.json({
        message: "User ID is required",
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

    const [data] = await db.select().from(user).where(eq(user.id, userId));

    if (!data) {
      return ctx.json({
        message: "User not found",
        error: "Not Found",
        statusCode: 404,
      });
    }

    return ctx.json({ message: "User found", data, statusCode: 200 });
  } catch (error) {
    return ctx.json({
      message:
        error instanceof Error
          ? error.message
          : "There was an error retrieving the users data.",
      error: "Internal Server Error",
      statusCode: 500,
    });
  }
}
