import { config } from "dotenv";
import { expo } from "@better-auth/expo";
import { openAPI } from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
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
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8080",
  trustedOrigins: allowedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 20,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, token }) => {
      await transporter.sendMail({
        from: `"ScholaFlow" <${process.env.APP_GMAIL_EMAIL}>`,
        to: user.email,
        subject: "Reset Your ScholaFlow Password",
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body
          style="
            border: 1px solid #dddfe6;
            border-radius: 0.75rem;
            padding: 1rem;
            background: #f3f6ff;
            display: grid;
          "
        >
          <img
            style="width: 150px"
            src="https://github.com/user-attachments/assets/bccbcc7a-c0df-40f5-b07c-72b5c874594e"
          />
          <h1>Password Reset Request, ${user.name.split(" ")[0]}</h1>
          <p>
            We received a request to reset your ScholaFlow account password. If this was you, please click the button below to reset your password:
          </p>
          <a
            style="
          display: inline-block;
          background-color: #22317c;
          color: #edf2ff;
          text-decoration: none;
          font-weight: 500;
          font-size: 16px;
          text-align: center;
          padding: 10px 20px;
          border-radius: 9999px;
          margin-top: 10px;
            "
            href="${process.env.APP_URL}/reset-password?token=${token}"
          >
            Reset password
          </a>
          <p>If you didn't request this password reset, please ignore this email or contact our support team. This link will expire in 1 day.</p>
          <p class="ng-star-inserted">
            <span class="ng-star-inserted">Happy learning!</span>
          </p>
          <p class="ng-star-inserted">
            <span class="ng-star-inserted">The ScholaFlow Team</span>
          </p>
        </body>
          </html>
        `,
      });
    },
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
    passkey(),
    openAPI(),
  ],
  advanced: {
    disableOriginCheck: process.env.NODE_ENV !== "production",
  },
});
