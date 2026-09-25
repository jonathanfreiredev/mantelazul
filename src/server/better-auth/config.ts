import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "~/env";
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
import {
  localeFromCookie,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../resend";

/** Google credentials, or undefined when sign-in with Google is not configured. */
function googleCredentials() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return undefined;

  return {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };
}

const google = googleCredentials();

/** Whether the credentials are in place, so the sign-in pages can hide the button otherwise. */
export const googleSignInEnabled = google !== undefined;

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
  socialProviders: google ? { google } : undefined,
  // Linking an account to a provider implicitly is what makes "sign in with Google using an
  // address I already registered here" work. It only happens when the local account has a
  // verified address, which is exactly what keeps a stranger from registering someone else's
  // email with a password and capturing their Google sign-in. Email verification is mandatory
  // (see `requireEmailVerification` below), so every usable account passes this check.
  account: {
    accountLinking: {
      enabled: true,
      requireLocalEmailVerified: true,
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    // Clicking the link signs the user in, so the flow ends inside the app.
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }, request) => {
      await sendVerificationEmail({
        to: user.email,
        url,
        locale: localeFromCookie(request?.headers.get("cookie") ?? null),
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    // Nobody uses the app before proving they control their address. This is also what makes the
    // `emailVerified` flag above trustworthy.
    requireEmailVerification: true,
    // Following a reset link already proves the inbox is theirs, so it verifies the address too
    // instead of sending the user through verification afterwards.
    onPasswordReset: async ({ user }) => {
      if (!user.emailVerified) {
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        });
      }
    },
    sendResetPassword: async ({ user, url }, request) => {
      await sendPasswordResetEmail({
        to: user.email,
        url,
        locale: localeFromCookie(request?.headers.get("cookie") ?? null),
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
