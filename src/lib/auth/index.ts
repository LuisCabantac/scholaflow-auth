import { eq } from "drizzle-orm";
import type { Context } from "hono";

import { db } from "../../db/index.js";
import { session, user } from "../../db/schema.js";

export async function validateSession(ctx: Context) {
  const authHeader = ctx.req.header("Authorization");

  if (!authHeader) {
    return {
      isValidSession: false,
      userId: null,
      message: "No authorization header found",
      error: "Unauthorized",
      statusCode: 401,
    };
  }

  if (!authHeader.startsWith("Bearer ")) {
    return {
      isValidSession: false,
      userId: null,
      message: "Invalid authorization header format",
      error: "Unauthorized",
      statusCode: 401,
    };
  }

  const token = authHeader.substring(7);

  try {
    const [isAuthorized] = await db
      .select()
      .from(session)
      .where(eq(session.token, token));

    if (!isAuthorized) {
      return {
        isValidSession: false,
        userId: null,
        message: "Invalid or expired token",
        error: "Unauthorized",
        statusCode: 401,
      };
    }

    const [userData] = await db
      .select()
      .from(user)
      .where(eq(user.id, isAuthorized.userId));

    return {
      isValidSession: true,
      userId: isAuthorized.userId,
      userData: userData,
      message: "Session validated successfully",
      error: null,
      statusCode: 200,
    };
  } catch (error) {
    return {
      isValidSession: false,
      userId: null,
      message: "Failed to validate session due to internal error",
      error: "Internal Server Error",
      statusCode: 500,
    };
  }
}
