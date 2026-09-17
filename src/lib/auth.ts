import { config } from "dotenv";
import { expo } from "@better-auth/expo";
import { openAPI, jwt } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth, type BetterAuthPlugin } from "better-auth";

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
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: sendDeleteAccountEmail,
    },
  },
  plugins: [
    expo({ disableOriginOverride: true }) as BetterAuthPlugin,
    openAPI(),
    jwt(),
  ],
  advanced: {
    disableOriginCheck: process.env.NODE_ENV !== "production",
  },
});
