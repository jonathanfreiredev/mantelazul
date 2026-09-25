import { Resend } from "resend";
import { env } from "~/env";
import { DEFAULT_LOCALE, isLocale, type Locale } from "~/lib/locales";

export const resend = new Resend(env.RESEND_API_KEY);

const FROM = "Mantel Azul <mantelazul@jonathanfreire.com>";

interface EmailCopy {
  subject: string;
  body: string;
  cta: string;
  footer: string;
}

type InviteEmailCopy = EmailCopy;

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

/**
 * The locale the browser is using, read from the cookie next-intl writes. Better Auth sends the
 * verification and password-reset emails from outside the request scope, so this is the only
 * locale signal available there.
 */
export function localeFromCookie(cookieHeader: string | null): Locale {
  const match = cookieHeader?.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  const value = match?.[1] ? decodeURIComponent(match[1]) : undefined;

  return isLocale(value) ? value : DEFAULT_LOCALE;
}

function emailLayout({
  body,
  url,
  cta,
  footer,
}: {
  body: string;
  url: string;
  cta: string;
  footer: string;
}): string {
  return `
    <div style="font-family: sans-serif; line-height: 1.6; color: #111;">
      <p>${body}</p>
      <p>
        <a href="${url}" style="display: inline-block; padding: 10px 18px; border-radius: 8px; background: #111; color: #fff; text-decoration: none;">
          ${cta}
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">${footer}</p>
    </div>
  `;
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
    html: emailLayout({
      body: interpolate(copy.body, values),
      url,
      cta: copy.cta,
      footer: copy.footer,
    }),
  });

  // The Resend SDK reports failures in the result instead of throwing, so the caller would
  // otherwise believe the invitation was delivered.
  if (error) {
    throw new Error(
      `Could not send the household invitation: ${error.message}`,
    );
  }
}

/**
 * Copy for the two emails Better Auth sends itself (verification and password reset), kept next
 * to the invitation one because all three live outside the next-intl request scope.
 */
const verificationCopy: Record<Locale, EmailCopy> = {
  en: {
    subject: "Verify your email for Mantel Azul",
    body: "Confirm this address to finish setting up your Mantel Azul account.",
    cta: "Verify email",
    footer: "If you did not create an account, you can ignore this email.",
  },
  es: {
    subject: "Verifica tu correo para Mantel Azul",
    body: "Confirma esta dirección para terminar de crear tu cuenta de Mantel Azul.",
    cta: "Verificar correo",
    footer: "Si no has creado una cuenta, puedes ignorar este correo.",
  },
  de: {
    subject: "Bestätige deine E-Mail für Mantel Azul",
    body: "Bestätige diese Adresse, um dein Mantel-Azul-Konto fertig einzurichten.",
    cta: "E-Mail bestätigen",
    footer:
      "Wenn du kein Konto erstellt hast, kannst du diese E-Mail ignorieren.",
  },
};

const resetCopy: Record<Locale, EmailCopy> = {
  en: {
    subject: "Reset your Mantel Azul password",
    body: "You asked to reset your password. Choose a new one with the link below.",
    cta: "Choose a new password",
    footer: "If you did not ask for this, you can ignore this email.",
  },
  es: {
    subject: "Restablece tu contraseña de Mantel Azul",
    body: "Has pedido restablecer tu contraseña. Elige una nueva con el enlace de abajo.",
    cta: "Elegir una contraseña nueva",
    footer: "Si no lo has pedido, puedes ignorar este correo.",
  },
  de: {
    subject: "Setze dein Mantel-Azul-Passwort zurück",
    body: "Du hast angefragt, dein Passwort zurückzusetzen. Wähle unten ein neues.",
    cta: "Neues Passwort wählen",
    footer: "Wenn du das nicht angefragt hast, kannst du diese E-Mail ignorieren.",
  },
};

async function sendCopy(
  copy: Record<Locale, EmailCopy>,
  { to, url, locale, failure }: { to: string; url: string; locale: Locale; failure: string },
): Promise<void> {
  const text = copy[locale] ?? copy[DEFAULT_LOCALE];

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: text.subject,
    html: emailLayout({ body: text.body, url, cta: text.cta, footer: text.footer }),
  });

  if (error) throw new Error(`${failure}: ${error.message}`);
}

/** Sends the "confirm your address" email Better Auth triggers on sign-up. */
export async function sendVerificationEmail({
  to,
  url,
  locale,
}: {
  to: string;
  url: string;
  locale: Locale;
}): Promise<void> {
  await sendCopy(verificationCopy, {
    to,
    url,
    locale,
    failure: "Could not send the verification email",
  });
}

/** Sends the "choose a new password" email Better Auth triggers on a reset request. */
export async function sendPasswordResetEmail({
  to,
  url,
  locale,
}: {
  to: string;
  url: string;
  locale: Locale;
}): Promise<void> {
  await sendCopy(resetCopy, {
    to,
    url,
    locale,
    failure: "Could not send the password reset email",
  });
}
