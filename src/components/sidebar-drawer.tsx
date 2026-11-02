import {
  BookMarkedIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  HouseIcon,
  LogInIcon,
  MenuIcon,
  NotepadTextIcon,
  PlusIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
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
  const tUi = await getTranslations("Ui");

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon-lg"
          className="rounded-sm"
          aria-label={t("menu")}
        >
          <MenuIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[50vh] data-[vaul-drawer-direction=top]:max-h-[50vh]">
        <DrawerHeader className="flex flex-row justify-end">
          <DrawerTitle className="sr-only">{t("menu")}</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="outline" size="icon-sm" className="rounded-full">
              <XIcon />
              <span className="sr-only">{tUi("close")}</span>
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex min-h-0 w-full flex-1 flex-col gap-0 overflow-y-auto px-2 pb-4">
          {!isLoggedIn && (
            <DrawerClose asChild>
              <Item
                variant="muted"
                size="sm"
                className="text-primary bg-primary/10 mb-2 cursor-pointer"
                asChild
              >
                <Link href="/login">
                  <ItemMedia>
                    <LogInIcon className="size-5" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{t("logIn")}</ItemTitle>
                  </ItemContent>
                </Link>
              </Item>
            </DrawerClose>
          )}

          <DrawerClose asChild>
            <Item
              variant="default"
              size="sm"
              className="cursor-pointer"
              asChild
            >
              <Link href="/everything">
                <ItemMedia>
                  <BookOpenIcon className="size-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{t("allRecipes")}</ItemTitle>
                </ItemContent>
              </Link>
            </Item>
          </DrawerClose>

          {isLoggedIn && (
            <>
              <DrawerClose asChild>
                <Item
                  variant="default"
                  size="sm"
                  className="cursor-pointer"
                  asChild
                >
                  <Link href="/recipes">
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
                  <Link href="/cookbooks">
                    <ItemMedia>
                      <BookMarkedIcon className="size-5" />
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
                  <Link href="/calendar">
                    <ItemMedia>
                      <CalendarDaysIcon className="size-5" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{t("calendar")}</ItemTitle>
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
                  <Link href="/household">
                    <ItemMedia>
                      <HouseIcon className="size-5" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{t("household")}</ItemTitle>
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
                  <Link href="/profile">
                    <ItemMedia>
                      <UserIcon className="size-5" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{t("profile")}</ItemTitle>
                    </ItemContent>
                  </Link>
                </Item>
              </DrawerClose>
            </>
          )}

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

          <SidebarDrawerLocale />

          <SidebarDrawerAuth isLoggedIn={isLoggedIn} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
