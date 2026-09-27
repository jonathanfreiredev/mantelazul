import { jsonLd } from "~/lib/seo/json-ld";

/**
 * Structured data block. It renders nothing visible: search engines read it out of the HTML, and
 * it is what lets a recipe result show its photo, times and rating.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd(data) }}
    />
  );
}
