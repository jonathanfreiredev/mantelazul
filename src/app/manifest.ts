import type { MetadataRoute } from "next";
import messages from "~/i18n/locales/en.json";
import { BRAND_COLOR, SITE_NAME } from "~/lib/seo/site";

/**
 * The web app manifest. Next serves it at `/manifest.webmanifest` and links it from every page,
 * which is what makes the site installable and gives Android its icon, name and colours.
 *
 * A manifest is one file rather than one per language, so its copy stays in the canonical
 * language.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: messages.Metadata.description,
    lang: "en",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: BRAND_COLOR,
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
