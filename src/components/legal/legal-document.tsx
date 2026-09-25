"use client";

import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "~/i18n/navigation";

/**
 * Styles for a full page of prose, written by hand for the same reason as the chat's renderer: the
 * app has no typography plugin, and a plugin's defaults would need overriding anyway.
 *
 * Links inside the documents are written as internal paths (`/terms`), so they are routed through
 * the locale-aware `Link` and keep the reader's language.
 */
const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-6 text-3xl font-semibold text-balance">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 mb-3 text-xl font-semibold text-balance">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 mb-2 text-base font-semibold">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => {
    const className = "underline underline-offset-2 hover:opacity-80";

    if (href?.startsWith("/")) {
      return (
        <Link href={href} className={className}>
          {children}
        </Link>
      );
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="my-8 border-current/20" />,
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-current/20 px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-current/20 px-3 py-2 align-top">{children}</td>
  ),
};

interface LegalDocumentProps {
  /** The document, as markdown, in the reader's language. */
  markdown: string;
}

/** Renders one legal document: a single column of readable prose, whatever the screen size. */
export function LegalDocument({ markdown }: LegalDocumentProps) {
  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-10">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </Markdown>
    </article>
  );
}
