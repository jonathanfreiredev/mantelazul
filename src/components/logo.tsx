"use client";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

export const Logo = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-full w-full" />;
  }

  console.log("Current theme:", resolvedTheme);

  const logoSrc =
    resolvedTheme === "dark" ? "/logo-light.png" : "/logo-dark.png";

  return (
    <Image
      src={logoSrc}
      alt="Logo"
      className="h-auto object-cover"
      fill
      sizes="(max-width: 768px) 150px, (max-width: 1200px) 200px, 250px"
    />
  );
};
