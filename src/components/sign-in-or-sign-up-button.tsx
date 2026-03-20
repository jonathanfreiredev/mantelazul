"use client";
import Link from "next/link";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";

export function SignInOrSignUpButton() {
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  return (
    <Button variant="outline" size="lg" asChild>
      <Link href={isLoginPage ? "/signup" : "/login"}>
        {isLoginPage ? "Sign up" : "Log in"}
      </Link>
    </Button>
  );
}
