"use client";

import { useTranslations } from "next-intl";
import type { HouseholdMemberDto } from "~/types/household";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "../ui/item";

interface HouseholdMembersListProps {
  members: HouseholdMemberDto[];
  ownerId: string | null;
  currentUserId: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}

export function HouseholdMembersList({
  members,
  ownerId,
  currentUserId,
}: HouseholdMembersListProps) {
  const t = useTranslations("Household");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("membersTitle")}</CardTitle>
      </CardHeader>

      <CardContent>
        <ItemGroup>
          {members.map((member) => (
            <Item key={member.id} variant="outline">
              <ItemMedia>
                <Avatar>
                  <AvatarFallback>{initials(member.name)}</AvatarFallback>
                </Avatar>
              </ItemMedia>

              <ItemContent>
                <ItemTitle>
                  {member.name}
                  {member.id === currentUserId && (
                    <span className="text-muted-foreground font-normal">
                      ({t("you")})
                    </span>
                  )}
                </ItemTitle>
                <ItemDescription>{member.email}</ItemDescription>
              </ItemContent>

              {member.id === ownerId && (
                <ItemActions>
                  <span className="border-border text-muted-foreground rounded-full border px-2 py-0.5 text-xs">
                    {t("owner")}
                  </span>
                </ItemActions>
              )}
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
