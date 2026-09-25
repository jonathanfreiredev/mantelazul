import { readFile } from "node:fs/promises";
import path from "node:path";
import "server-only";
import type { Locale } from "~/lib/locales";

/**
 * The legal documents, one per route. The slug is the same in every language, so `/privacy` and
 * `/terms` stay where they are whatever the locale prefix is.
 */
export const LEGAL_DOCUMENTS = ["privacy", "terms"] as const;

export type LegalDocument = (typeof LEGAL_DOCUMENTS)[number];

/**
 * The copy lives in `src/content/legal/<locale>/`, one markdown file per document. Plain markdown
 * rendered with `react-markdown`, which the chat already depends on, so two static pages do not
 * pull in an MDX toolchain.
 *
 * The files are read from disk while the page renders, so `next.config.js` lists this folder in
 * `outputFileTracingIncludes`; without it the deployment would not ship the files.
 */
const LEGAL_DIRECTORY = path.join(process.cwd(), "src", "content", "legal");

export async function readLegalDocument(
  document: LegalDocument,
  locale: Locale,
): Promise<string> {
  return readFile(path.join(LEGAL_DIRECTORY, locale, `${document}.md`), "utf8");
}
