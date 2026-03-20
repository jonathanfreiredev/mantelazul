import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "~/server/db";
import { resend } from "../resend";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql", // or "sqlite" or "mysql"
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      void resend.emails.send({
        from: "Saborio <admin@saborio.com",
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
