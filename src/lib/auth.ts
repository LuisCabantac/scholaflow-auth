import { config } from "dotenv";
import { expo } from "@better-auth/expo";
import { openAPI } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { inferAdditionalFields } from "better-auth/client/plugins";

import { db } from "../db/index.js";
import { schema } from "../db/schema.js";

config({ path: ".env.local" });

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8080",
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:8080",
    ...(process.env.ALLOWED_ORIGINS?.split(",") || []),
  ],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 20,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
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
  ],
  advanced: {
    disableOriginCheck: true,
  },
});
