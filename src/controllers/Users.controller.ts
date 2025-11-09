import { eq } from "drizzle-orm";
import type { Context } from "hono";

import { db } from "../db/index.js";
import { auth } from "../lib/auth.js";
import { account, user } from "../db/schema.js";
import { validateSession } from "../lib/auth/index.js";
import { extractAvatarFilePath } from "../lib/utils.js";
import { editUserSchema, emailSchema } from "../lib/schema/index.js";
import {
  deleteFileFromBucket,
  uploadAttachments,
} from "../lib/service/bucket.js";

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
          : "There was an error retrieving the users data",
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
          : "There was an error retrieving the users data",
      error: "Internal Server Error",
      statusCode: 500,
    });
  }
}

export async function updateProfile(ctx: Context) {
  try {
    const userId = ctx.req.param("userId");
    const body = await ctx.req.json();

    if (!userId) {
      return ctx.json({
        message: "User ID is required",
        error: "Bad Request",
        statusCode: 400,
      });
    }

    if (!body || Object.keys(body).length === 0) {
      return ctx.json({
        message: "Request body is required",
        error: "Bad Request",
        statusCode: 400,
      });
    }

    const {
      email,
      name,
      schoolName,
      attachment,
      currentPassword,
      newPassword,
      confirmNewPassword,
    } = body;

    const { isValidSession, header } = await validateSession(ctx);

    if (!isValidSession) {
      return ctx.json({
        message: "Invalid or expired token",
        error: "Unauthorized",
        statusCode: 401,
      });
    }

    if (
      (newPassword || confirmNewPassword) &&
      newPassword !== confirmNewPassword
    ) {
      return ctx.json({
        message:
          "Passwords do not match. Please ensure both password fields are identical",
        error: "Bad Request",
        statusCode: 400,
      });
    }

    const [currentUserData] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId));

    if (!currentUserData) {
      return ctx.json({
        message: "User not found",
        error: "Not Found",
        statusCode: 404,
      });
    }

    const [currentAccountData] = await db
      .select()
      .from(account)
      .where(eq(account.userId, userId));

    if (!currentAccountData) {
      return ctx.json({
        message: "Account not found",
        error: "Not Found",
        statusCode: 404,
      });
    }

    const authCtx = await auth.$context;

    if (
      currentUserData.email !== email ||
      currentUserData.name !== name ||
      currentUserData.schoolName !== schoolName ||
      (currentAccountData.providerId === "google" && newPassword) ||
      (currentAccountData.providerId === "credential" &&
        currentPassword &&
        newPassword &&
        !(await authCtx.password.verify({
          password: newPassword,
          hash: currentAccountData.password ?? "",
        }))) ||
      attachment
    ) {
      const emailExists = await db
        .select()
        .from(user)
        .where(eq(user.email, email));

      if (currentUserData.email !== email && emailExists) {
        return ctx.json({
          message: "Email address already in use",
          error: "Conflict",
          statusCode: 409,
        });
      }

      const newProfilePhoto = attachment
        ? await uploadAttachments(
            ctx,
            "avatars",
            currentUserData.id,
            attachment as File
          )
        : currentUserData.image;

      if (
        attachment &&
        !currentUserData.image.startsWith("https://lh3.googleusercontent.com/")
      ) {
        const filePath = extractAvatarFilePath(currentUserData.image);
        await deleteFileFromBucket(ctx, "avatars", filePath);
      }

      if (newPassword) {
        if (newPassword.length < 8 || newPassword.length > 20) {
          return ctx.json({
            message: "Password must be between 8 and 20 characters long",
            error: "Bad Request",
            statusCode: 400,
          });
        }

        if (currentAccountData.providerId === "google") {
          const result = await auth.api.setPassword({
            body: { newPassword },
            headers: header
              ? {
                  Authorization: header,
                }
              : undefined,
          });

          if (!result) {
            return ctx.json({
              message: "Failed to update password for Google account",
              error: "Internal Server Error",
              statusCode: 500,
            });
          }
        }

        if (currentAccountData.providerId === "credential") {
          if (!currentPassword) {
            return ctx.json({
              message: "Current password is required to update your password",
              error: "Bad Request",
              statusCode: 400,
            });
          }

          try {
            const result = await auth.api.changePassword({
              body: {
                newPassword,
                currentPassword,
                revokeOtherSessions: true,
              },
              headers: header
                ? {
                    Authorization: header,
                  }
                : undefined,
            });

            if (!result) {
              return ctx.json({
                message:
                  "Failed to update password. Please check your current password and try again.",
                error: "Unauthorized",
                statusCode: 401,
              });
            }
          } catch (error: unknown) {
            if (
              error &&
              typeof error === "object" &&
              "status" in error &&
              "statusCode" in error &&
              error.status === "BAD_REQUEST" &&
              error.statusCode === 400
            ) {
              return ctx.json({
                message: "Current password is incorrect. Please try again.",
                error: "Bad Request",
                statusCode: 400,
              });
            }

            return ctx.json({
              message: "Current password is incorrect. Please try again.",
              error: "Bad Request",
              statusCode: 400,
            });
          }
        }
      }

      const updatedUserData = {
        name,
        email,
        image: newProfilePhoto,
        schoolName,
        updatedAt: new Date(),
      };

      const result = editUserSchema.safeParse(updatedUserData);

      if (result.error) {
        return ctx.json({
          message: "Invalid user data",
          error: "Bad Request",
          statusCode: 400,
          details: result.error.issues,
        });
      }

      const [updatedUser] = await db
        .update(user)
        .set(result.data)
        .where(eq(user.id, userId))
        .returning();

      if (!updatedUser) {
        return ctx.json({
          message: "Failed to update user profile",
          error: "Internal Server Error",
          statusCode: 500,
        });
      }

      return ctx.json({
        message: "Profile updated successfully",
        statusCode: 200,
        data: updatedUser,
      });
    }

    return ctx.json({
      message: "No changes were made to your profile.",
      statusCode: 200,
      data: null,
    });
  } catch (error) {
    return ctx.json({
      message:
        error instanceof Error
          ? error.message
          : "There was an error updating the users data",
      error: "Internal Server Error",
      statusCode: 500,
    });
  }
}
