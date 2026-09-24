import {
  BookIcon,
  MenuIcon,
  NotepadTextIcon,
  PlusIcon,
  SquareDotIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { categories } from "~/lib/categories-list";
import { SidebarDrawerAuth } from "./sidebar-drawer-auth";
import { SidebarDrawerLocale } from "./sidebar-drawer-locale";
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
  const t = await getTranslations("Menu");
  const tCategories = await getTranslations("CategoryPages");

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon-lg" className="rounded-sm">
          <MenuIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[50vh] data-[vaul-drawer-direction=top]:max-h-[50vh]">
        <DrawerHeader className="flex flex-row justify-end">
          <DrawerTitle className="sr-only">{t("menu")}</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="outline" size="icon-sm" className="rounded-full">
              <XIcon />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex min-h-0 w-full flex-1 flex-col gap-0 overflow-y-auto px-2 pb-4">
          {categories
            .filter((category) => category.name !== "explore")
            .map((category) => (
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
                      <ItemTitle>
                        {tCategories(`${category.name}.name`)}
                      </ItemTitle>
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
              <Link href={isLoggedIn ? "/recipes" : "/login"}>
                <ItemMedia>
                  <NotepadTextIcon className="size-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{t("myRecipes")}</ItemTitle>
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
                  <ItemTitle>{t("myCookbooks")}</ItemTitle>
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
                  <ItemTitle>{t("newRecipe")}</ItemTitle>
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
                  <ItemTitle>{t("profile")}</ItemTitle>
                </ItemContent>
              </Link>
            </Item>
          </DrawerClose>

          <SidebarDrawerLocale />

          <SidebarDrawerAuth />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
