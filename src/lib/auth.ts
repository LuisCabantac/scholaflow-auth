import { config } from "dotenv";
import { expo } from "@better-auth/expo";
import { openAPI, bearer } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import { parseSetCookieHeader } from "better-auth/cookies";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { inferAdditionalFields } from "better-auth/client/plugins";

import { db } from "../db/index.js";
import { schema } from "../db/schema.js";
import { allowedOrigins } from "../middleware/cors.js";
import {
  sendDeleteAccountEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "./service/email.js";

config({ path: ".env" });

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8080",
  trustedOrigins: allowedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 20,
    requireEmailVerification: true,
    sendResetPassword: sendResetPasswordEmail,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  emailVerification: {
    sendVerificationEmail: sendVerificationEmail,
    sendOnSignUp: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "user",
      },
      schoolName: {
        type: "string",
        required: false,
        defaultValue: null,
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: sendDeleteAccountEmail,
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/callback")) {
        const location =
          ctx.context.responseHeaders?.get("location") ||
          ctx.context.responseHeaders?.get("Location");
        const setCookie = ctx.context.responseHeaders?.get("set-cookie");

        if (location && setCookie) {
          const parsed = parseSetCookieHeader(setCookie);
          const cookieName = ctx.context.authCookies.sessionToken.name;
          const token = parsed.get(cookieName)?.value;

          if (token) {
            const redirectUrl = new URL(
              location,
              ctx.context.baseURL || "http://localhost:8080",
            );

            const isDesktopOrPopup =
              redirectUrl.searchParams.get("popup") === "true" ||
              redirectUrl.protocol === "wails:" ||
              redirectUrl.hostname.includes("wails") ||
              redirectUrl.port === "9245" ||
              redirectUrl.port === "9246";

            if (isDesktopOrPopup) {
              redirectUrl.searchParams.set("token", token);
              ctx.setHeader("Location", redirectUrl.toString());
            }
          }
        }
      }
    }),
  },
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: true,
          defaultValue: "user",
        },
        schoolName: {
          type: "string",
          required: false,
          defaultValue: null,
        },
      },
    }),
    expo({ disableOriginOverride: true }) as BetterAuthPlugin,
    openAPI(),
    bearer(),
  ],
  advanced: {
    disableOriginCheck: process.env.NODE_ENV !== "production",
  },
});
