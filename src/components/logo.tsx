"use client";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

export const Logo = () => {
  const t = useTranslations("Ui");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-full w-full" />;
  }

  const logoSrc =
    resolvedTheme === "dark" ? "/logo-light.png" : "/logo-dark.png";

  return (
    <Image
      src={logoSrc}
      alt={t("logoAlt")}
      className="h-auto object-cover"
      fill
      sizes="(max-width: 768px) 150px, (max-width: 1200px) 200px, 250px"
    />
  );
};
