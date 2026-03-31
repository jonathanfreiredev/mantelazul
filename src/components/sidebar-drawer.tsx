import {
  BookIcon,
  MenuIcon,
  NotepadTextIcon,
  PlusIcon,
  SquareDotIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { categories } from "~/lib/categories-list";
import { capitalize } from "~/lib/utils";
import { SidebarDrawerAuth } from "./sidebar-drawer-auth";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { Item, ItemContent, ItemMedia, ItemTitle } from "./ui/item";

interface SidebarDrawerProps {
  isLoggedIn: boolean;
}

export async function SidebarDrawer({ isLoggedIn }: SidebarDrawerProps) {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon-lg" className="rounded-sm">
          <MenuIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[50vh] data-[vaul-drawer-direction=top]:max-h-[50vh]">
        <DrawerHeader className="flex flex-row justify-end">
          <DrawerTitle className="sr-only">Menu</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="outline" size="icon-sm" className="rounded-full">
              <XIcon />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex w-full flex-col gap-0 px-2">
          {categories.map((category) => (
            <DrawerClose key={category.name} asChild>
              <Item
                variant="default"
                size="sm"
                className="cursor-pointer"
                asChild
              >
                <Link href={category.href}>
                  <ItemMedia>
                    <SquareDotIcon className="size-5" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{capitalize(category.name)}</ItemTitle>
                  </ItemContent>
                </Link>
              </Item>
            </DrawerClose>
          ))}

          <DrawerClose asChild>
            <Item
              variant="default"
              size="sm"
              className="cursor-pointer"
              asChild
            >
              <Link href={isLoggedIn ? "/cookbooks" : "/login"}>
                <ItemMedia>
                  <BookIcon className="size-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Cookbooks</ItemTitle>
                </ItemContent>
              </Link>
            </Item>
          </DrawerClose>

          <DrawerClose asChild>
            <Item
              variant="default"
              size="sm"
              className="cursor-pointer"
              asChild
            >
              <Link href={isLoggedIn ? "/recipes" : "/login"}>
                <ItemMedia>
                  <NotepadTextIcon className="size-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>My recipes</ItemTitle>
                </ItemContent>
              </Link>
            </Item>
          </DrawerClose>

          <DrawerClose asChild>
            <Item
              variant="default"
              size="sm"
              className="cursor-pointer"
              asChild
            >
              <Link href={isLoggedIn ? "/cookbooks" : "/login"}>
                <ItemMedia>
                  <NotepadTextIcon className="size-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>My cookbooks</ItemTitle>
                </ItemContent>
              </Link>
            </Item>
          </DrawerClose>

          <DrawerClose asChild>
            <Item
              variant="default"
              size="sm"
              className="cursor-pointer"
              asChild
            >
              <Link href={isLoggedIn ? "/recipes/new" : "/login"}>
                <ItemMedia>
                  <PlusIcon className="size-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>New recipe</ItemTitle>
                </ItemContent>
              </Link>
            </Item>
          </DrawerClose>

          <DrawerClose asChild>
            <Item
              variant="default"
              size="sm"
              className="cursor-pointer"
              asChild
            >
              <Link href={isLoggedIn ? "/profile" : "/login"}>
                <ItemMedia>
                  <UserIcon className="size-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Profile</ItemTitle>
                </ItemContent>
              </Link>
            </Item>
          </DrawerClose>

          <SidebarDrawerAuth />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
