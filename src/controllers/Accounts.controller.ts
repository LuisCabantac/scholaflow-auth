import { eq } from "drizzle-orm";
import type { Context } from "hono";

import { db } from "../db/index.js";
import { account } from "../db/schema.js";
import { validateSession } from "../lib/auth/index.js";

export async function getAccountByUserId(ctx: Context) {
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

    const [data] = await db
      .select()
      .from(account)
      .where(eq(account.userId, userId));

    if (!data) {
      return ctx.json({
        message: "Account not found",
        error: "Not Found",
        statusCode: 404,
      });
    }

    return ctx.json({ message: "Account found", data, statusCode: 200 });
  } catch (error) {
    return ctx.json({
      message:
        error instanceof Error
          ? error.message
          : "There was an error retrieving the account data",
      error: "Internal Server Error",
      statusCode: 500,
    });
  }
}
