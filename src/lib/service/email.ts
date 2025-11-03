import { config } from "dotenv";
import nodemailer from "nodemailer";

config({ path: ".env.local" });

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
