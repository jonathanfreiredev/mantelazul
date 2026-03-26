"use client";

import { useEffect, useState } from "react";

export const breakpoints = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
};

export function useMediaQuery(query: string): boolean {
  const [mounted, setMounted] = useState(false);
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    setMounted(true);

    const media = window.matchMedia(query);

    const handleChange = () => {
      setMatches(media.matches);
    };

    handleChange(); // sync inicial
    media.addEventListener("change", handleChange);

    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, [query]);

  // 👇 evita hydration mismatch
  if (!mounted) return false;

  return matches;
}
