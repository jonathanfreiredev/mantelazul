import { readFile } from "node:fs/promises";
import path from "node:path";
import { getTranslations } from "next-intl/server";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { toLocale } from "~/lib/locales";
import { SITE_NAME, SITE_URL } from "~/lib/seo/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** How wide the logo is drawn on the card, in pixels. */
const LOGO_WIDTH = 700;
/** Prepared at twice the drawn size so it stays sharp on a high-density display. */
const LOGO_SCALE = 2;

/**
 * The logo, cropped to its artwork and scaled for the card.
 *
 * `public/logo-dark.png` is a 2000×2000 canvas with the mark floating in the middle of a lot of
 * transparent space: drawn as it is, the card would be mostly empty. Trimming it here keeps that
 * file as the single source of truth, instead of adding a second copy to the repository that can
 * drift from it.
 */
async function loadLogo() {
  const file = await readFile(path.join(process.cwd(), "public/logo-dark.png"));

  const { data, info } = await sharp(file)
    .trim()
    .resize({ width: LOGO_WIDTH * LOGO_SCALE })
    .png()
    .toBuffer({ resolveWithObject: true });

  return {
    src: `data:image/png;base64,${data.toString("base64")}`,
    width: info.width,
    height: info.height,
  };
}

let logoPromise: ReturnType<typeof loadLogo> | undefined;

/** The logo only changes with a deploy, so it is prepared once per server instance. */
function getLogo() {
  logoPromise ??= loadLogo();

  return logoPromise;
}

/**
 * The card every page shares on social networks: the logo, what the site is for, and where it
 * lives. A recipe page replaces it with the photo of the dish.
 */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale: toLocale(locale),
    namespace: "Metadata",
  });
  const { src, width, height } = await getLogo();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 44,
        backgroundColor: "#ffffff",
        color: "#252525",
      }}
    >
      <img
        src={src}
        alt=""
        width={LOGO_WIDTH}
        height={Math.round((height / width) * LOGO_WIDTH)}
      />
      {/* Wraps instead of clipping if a translation ever outgrows the card. */}
      <div style={{ fontSize: 38 }}>{t("tagline")}</div>
      <div style={{ fontSize: 28, color: "#6b7280" }}>
        {new URL(SITE_URL).host}
      </div>
    </div>,
    size,
  );
}
