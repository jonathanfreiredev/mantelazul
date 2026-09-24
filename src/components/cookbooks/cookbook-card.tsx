"use client";
import { EllipsisVerticalIcon } from "lucide-react";
import { Link, useRouter } from "~/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { CookbookDto } from "~/types/cookbook";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { UpdateCookbookForm } from "./update-cookbook-form";
import Image from "next/image";

interface CookbookCardProps {
  cookbook: CookbookDto;
  isEditable?: boolean;
}

export function CookbookCard({ cookbook }: CookbookCardProps) {
  const t = useTranslations("Cookbook");
  const tCommon = useTranslations("Common");
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteCookbook = api.cookbooks.delete.useMutation();

  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await deleteCookbook.mutateAsync({ id: cookbook.id });

    if (res.success) {
      router.refresh();
      toast.success(t("deleted"));
    } else {
      toast.error(t("deleteFailed"));
    }
    setIsDeleting(false);
  };

  return (
    <Card className="relative w-full rounded-sm pt-0">
      <div className="relative h-48 w-full overflow-hidden rounded-t-sm bg-gray-300 2xl:h-56">
        {cookbook.images.length === 1 ? (
          <Image
            src={cookbook.images[0]!}
            alt={t("imageAlt")}
            fill
            className="object-cover"
          />
        ) : cookbook.images.length === 2 ? (
          <div className="absolute grid h-full w-full grid-cols-2">
            <div className="relative">
              <Image
                src={cookbook.images[0]!}
                alt={t("imageAlt")}
                fill
                className="object-cover"
              />
            </div>
            <div className="relative">
              <Image
                src={cookbook.images[1]!}
                alt={t("imageAlt")}
                fill
                className="object-cover"
              />
            </div>
          </div>
        ) : (
          cookbook.images.length > 2 && (
            <div className="absolute grid h-full w-full grid-cols-2 grid-rows-2">
              <div className="relative row-span-2">
                <Image
                  src={cookbook.images[0]!}
                  alt={t("imageAlt")}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative">
                <Image
                  src={cookbook.images[1]!}
                  alt={t("imageAlt")}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative">
                <Image
                  src={cookbook.images[2]!}
                  alt={t("imageAlt")}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild className="absolute right-0 z-20 m-2">
            <Button variant="secondary" size="icon-lg" color="red">
              <EllipsisVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={isDeleting}
                onClick={() => setOpenUpdate(true)}
              >
                {tCommon("edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isDeleting}
                onClick={() => setOpenDelete(true)}
              >
                {tCommon("delete")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CardHeader>
        <Link href={`/cookbooks/${cookbook.id}`}>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="nowrap line-clamp-1">{cookbook.name}</div>
          </CardTitle>
        </Link>
      </CardHeader>

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCommon("confirmTitle")}</DialogTitle>
            <DialogDescription>
              {tCommon("confirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-end">
            <DialogClose asChild>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {tCommon("delete")}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpdateCookbookForm
        cookbook={cookbook}
        open={openUpdate}
        onOpenChange={setOpenUpdate}
      />
    </Card>
  );
}
