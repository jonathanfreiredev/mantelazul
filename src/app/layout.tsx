// The real layout lives in `[locale]/layout.tsx`, which owns <html> and <body> so it can set
// the `lang` attribute from the active locale. This root layout just passes the tree through.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
