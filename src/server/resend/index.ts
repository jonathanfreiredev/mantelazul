import { Resend } from "resend";
import { env } from "~/env";
import { DEFAULT_LOCALE, type Locale } from "~/lib/locales";

export const resend = new Resend(env.RESEND_API_KEY);

const FROM = "Mantel Azul <mantelazul@jonathanfreire.com>";

interface InviteEmailCopy {
  subject: string;
  body: string;
  cta: string;
  footer: string;
}

/**
 * The invitation email is sent from the server, outside the next-intl request scope, so its copy
 * lives here rather than in the locale JSON files.
 */
const inviteCopy: Record<Locale, InviteEmailCopy> = {
  en: {
    subject: "{inviter} invited you to {household}",
    body: "<strong>{inviter}</strong> invited you to join the household <strong>{household}</strong> on Mantel Azul, so you can plan meals together.",
    cta: "Accept invitation",
    footer:
      "If you were not expecting this invitation, you can safely ignore this email.",
  },
  es: {
    subject: "{inviter} te ha invitado a {household}",
    body: "<strong>{inviter}</strong> te ha invitado al hogar <strong>{household}</strong> en Mantel Azul para planificar las comidas juntos.",
    cta: "Aceptar invitación",
    footer:
      "Si no esperabas esta invitación, puedes ignorar este correo sin problema.",
  },
  de: {
    subject: "{inviter} hat dich zu {household} eingeladen",
    body: "<strong>{inviter}</strong> hat dich eingeladen, dem Haushalt <strong>{household}</strong> bei Mantel Azul beizutreten, um Mahlzeiten gemeinsam zu planen.",
    cta: "Einladung annehmen",
    footer:
      "Wenn du diese Einladung nicht erwartet hast, kannst du diese E-Mail ignorieren.",
  },
};

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(
    /\{(\w+)\}/g,
    (_match, key: string) => values[key] ?? "",
  );
}

/** Names are user input, so they are escaped before going into the email HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface HouseholdInviteEmail {
  to: string;
  householdName: string;
  inviterName: string;
  url: string;
  locale: Locale;
}

export async function sendHouseholdInviteEmail({
  to,
  householdName,
  inviterName,
  url,
  locale,
}: HouseholdInviteEmail): Promise<void> {
  const copy = inviteCopy[locale] ?? inviteCopy[DEFAULT_LOCALE];
  const values = {
    inviter: escapeHtml(inviterName),
    household: escapeHtml(householdName),
  };

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: interpolate(copy.subject, {
      inviter: inviterName,
      household: householdName,
    }),
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; color: #111;">
        <p>${interpolate(copy.body, values)}</p>
        <p>
          <a href="${url}" style="display: inline-block; padding: 10px 18px; border-radius: 8px; background: #111; color: #fff; text-decoration: none;">
            ${copy.cta}
          </a>
        </p>
        <p style="font-size: 13px; color: #666;">${copy.footer}</p>
      </div>
    `,
  });

  // The Resend SDK reports failures in the result instead of throwing, so the caller would
  // otherwise believe the invitation was delivered.
  if (error) {
    throw new Error(
      `Could not send the household invitation: ${error.message}`,
    );
  }
}
