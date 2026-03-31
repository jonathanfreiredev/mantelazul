import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "~/server/db";
import { resend } from "../resend";

export const auth = betterAuth({
  baseURL: {
    allowedHosts: [
      "localhost:3000",
      "localhost:5173",
      "mantelazul.com",
      "www.mantelazul.com",
      "mantelazul.jonathanfreire.com",
      "*.vercel.app",
    ],
    protocol: process.env.NODE_ENV === "development" ? "http" : "https",
  },
  database: prismaAdapter(db, {
    provider: "postgresql", // or "sqlite" or "mysql"
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      await resend.emails.send({
        from: "Mantel Azul <mantelazul@jonathanfreire.com>",
        to: user.email,
        subject: "Reset your password",
        html: `
          <p>Click the link below to reset your password:</p>
          <a href="${url}">${url}</a>
        `,
      });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
