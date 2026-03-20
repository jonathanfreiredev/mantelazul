"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { signOut } from "~/server/better-auth/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface DropdownAvatarMenuProps {
  user: {
    name: string;
  };
}
export const DropdownAvatarMenu = ({ user }: DropdownAvatarMenuProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer" size="lg">
          {/* <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                  className="grayscale"
                /> */}
          <AvatarFallback className="bg-green-50">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>My Recipes</DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={async () => {
            setIsSubmitting(true);
            await signOut();
            router.refresh();
            setIsSubmitting(false);
          }}
          disabled={isSubmitting}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
