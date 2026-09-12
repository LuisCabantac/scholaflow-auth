import { config } from "dotenv";
import nodemailer from "nodemailer";

config({ path: ".env" });

export const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  auth: {
    user: process.env.APP_GMAIL_EMAIL,
    pass: process.env.APP_GMAIL_PASSWORD,
  },
  secure: true,
  port: 465,
});

const LOGO_URL =
  "https://github.com/user-attachments/assets/bccbcc7a-c0df-40f5-b07c-72b5c874594e";

interface AuthEmailContext {
  user: {
    name?: string | null;
    email: string;
  };
  token: string;
}

export async function sendResetPasswordEmail({
  user,
  token,
}: AuthEmailContext): Promise<void> {
  const firstName = user.name?.split(" ")[0] || "";

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
        src="${LOGO_URL}"
      />
      <h1>Password Reset Request, ${firstName}</h1>
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
}

export async function sendVerificationEmail({
  user,
  token,
}: AuthEmailContext): Promise<void> {
  const firstName = user.name?.split(" ")[0] || "";

  await transporter.sendMail({
    from: `"ScholaFlow" <${process.env.APP_GMAIL_EMAIL}>`,
    to: user.email,
    subject: "Welcome to ScholaFlow! Verify Your Email",
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
        src="${LOGO_URL}"
      />
      <h1>Thanks for signing up ${firstName}!</h1>
      <p>
        You're almost there! Just one click to activate your ScholaFlow account
        and experience smarter, more engaging learning:
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
        href="${process.env.APP_URL}/verify?token=${token}"
      >
        Verify email
      </a>
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
}

export async function sendDeleteAccountEmail({
  user,
  token,
}: AuthEmailContext): Promise<void> {
  const firstName = user.name?.split(" ")[0] || "";

  await transporter.sendMail({
    from: `"ScholaFlow" <${process.env.APP_GMAIL_EMAIL}>`,
    to: user.email,
    subject: "Confirm Your ScholaFlow Account Deletion",
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
        src="${LOGO_URL}"
      />
      <h1>Account Closure Request, ${firstName}</h1>
      <p>
        We received a request to close your ScholaFlow account. If this was you, please click the button below to confirm and permanently delete your account:
      </p>
      <a
        style="
          display: inline-block;
          background-color: #dc2626;
          color: #edf2ff;
          text-decoration: none;
          font-weight: 500;
          font-size: 16px;
          text-align: center;
          padding: 10px 20px;
          border-radius: 9999px;
          margin-top: 10px;
        "
        href="${process.env.APP_URL}/close-account?token=${token}"
      >
        Confirm account closure
      </a>
      <p style="margin-top: 1rem; color: #dc2626; font-weight: 500;">⚠️ Warning: This action cannot be undone. All your data will be permanently deleted.</p>
      <p>If you didn't request this account closure, please ignore this email or contact our support team.</p>
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
}
