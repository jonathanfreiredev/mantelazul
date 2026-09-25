import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "~/server/db";
import {
  clearRecipeLikes,
  deleteUnpublishedRecipes,
  revokePendingInvitesForEmail,
} from "../account-deletion";
import {
  deleteMemberlessHouseholds,
  reassignHouseholdOwnership,
} from "../households";
import { resend } from "../resend";

export const auth = betterAuth({
  baseURL: {
    allowedHosts: [
      "localhost:3000",
      "localhost:5173",
      "mantelazul.com",
      "www.mantelazul.com",
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
    deleteUser: {
      enabled: true,
      // Deleting an account cascades everything the user owns: sessions, accounts, cookbooks, the
      // chat and the meals they created (`MealPlanEntry.createdById`), shared ones included. The
      // recipes survive as public content, so their likes, the unpublished ones and the
      // invitations to this email are cleaned up first. Ownership is handed over so the household
      // survives with a valid owner, and memberless households are removed afterwards.
      beforeDelete: async (user) => {
        await reassignHouseholdOwnership(user.id);
        await clearRecipeLikes(user.id);
        await deleteUnpublishedRecipes(user.id);
        await revokePendingInvitesForEmail(user.email);
      },
      afterDelete: async () => {
        await deleteMemberlessHouseholds();
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
