"use client";

import { Category, Difficulty } from "generated/prisma/enums";
import {
  CalendarArrowDownIcon,
  HeartIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { breakpoints, useMediaQuery } from "~/hooks/use-media-query";
import { useGetAllRecipes } from "~/hooks/useGetAllRecipes";
import { RecipeCard } from "./recipe-card";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "./ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./ui/input-group";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { capitalize } from "~/lib/utils";

export type OrderBy = "createdAt" | "likesCount";

interface RecipesProps {
  authorId?: string;
  cookbookId?: string;
  categoryPage?: Category;
  isEditable: boolean;
}

enum CategoryEnum {
  MAIN_COURSE = "Main Course",
  DESSERT = "Dessert",
  DRINK = "Drink",
  STARTER = "Starter",
  SNACK = "Snack",
  BREAKFAST = "Breakfast",
}

export function Recipes({
  authorId,
  cookbookId,
  categoryPage,
  isEditable,
}: RecipesProps) {
  // State for filters and pagination
  const [openedDrawer, setOpenedDrawer] = useState(false);
  const [orderBy, setOrderBy] = useState<OrderBy>("createdAt");
  const [category, setCategory] = useState<Category | null>(
    categoryPage || null,
  );
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);

  //Draft values for filters
  const [draftOrderBy, setDraftOrderBy] = useState<OrderBy>("createdAt");
  const [draftCategory, setDraftCategory] = useState<Category | null>(
    categoryPage || null,
  );
  const [draftDifficulty, setDraftDifficulty] = useState<Difficulty | null>(
    null,
  );
  const [draftSearch, setDraftSearch] = useState("");

  const isDesktop = useMediaQuery(breakpoints.md);
  const pathname = usePathname();

  const {
    data: resRecipes,
    isFetching,
    isError,
  } = useGetAllRecipes({
    authorId,
    cookbookId,
    orderBy,
    category: category || undefined,
    difficulty: difficulty || undefined,
    search: search || undefined,
    skip,
  });

  if (isFetching && skip === 0) {
    return <p className="text-muted-foreground mt-4 text-center">Loading...</p>;
  }

  if (isError) return null;

  const { recipes, pagination } = resRecipes;

  const clearFilters = () => {
    setDraftCategory(null);
    setDraftDifficulty(null);
    setDraftOrderBy("createdAt");
  };

  const openDrawer = () => {
    setOpenedDrawer(true);
  };

  const closeDrawer = () => {
    setOpenedDrawer(false);
    setDraftCategory(category);
    setDraftDifficulty(difficulty);
    setDraftOrderBy(orderBy);
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mt-7 flex w-full flex-col items-center gap-4 sm:flex-row">
        <Field className="max-w-sm">
          <InputGroup>
            <InputGroupInput
              id="inline-start-input"
              value={draftSearch}
              autoComplete="off"
              className="focus:outline-none"
              onChange={(e) => {
                setDraftSearch(e.target.value);
              }}
            />
            <InputGroupAddon align="inline-start">
              <SearchIcon className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                variant="secondary"
                onClick={() => {
                  setSearch(draftSearch);
                  clearFilters();
                  setCategory(null);
                  setDifficulty(null);
                  setOrderBy("createdAt");
                  setSkip(0);
                }}
              >
                Search
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <div className="flex w-full justify-end">
          {(category || difficulty) && (
            <div className="flex items-center gap-2 rounded-md border px-3 py-1 text-sm">
              {category && <span>{CategoryEnum[category]}</span>}
              {category && difficulty && " | "}
              {difficulty && (
                <span className="capitalize"> {difficulty.toLowerCase()}</span>
              )}
            </div>
          )}

          <Drawer
            direction={isDesktop ? "right" : "bottom"}
            open={openedDrawer}
            onOpenChange={(open) => {
              if (!open) {
                closeDrawer();
              } else {
                openDrawer();
              }
            }}
          >
            <DrawerTrigger asChild>
              <Button variant="ghost">
                <div className="flex items-center gap-1">
                  <SlidersHorizontalIcon />
                  Filter
                </div>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Filter</DrawerTitle>
              </DrawerHeader>

              <div className="flex flex-col gap-4 p-4">
                <FieldSet className="flex flex-col gap-2">
                  <FieldLegend variant="label">Order by</FieldLegend>
                  <RadioGroup
                    className="grid w-full grid-cols-2 gap-2"
                    value={draftOrderBy || undefined}
                    onValueChange={(value) => setDraftOrderBy(value as OrderBy)}
                  >
                    {Object.entries({
                      createdAt: "Creation date",
                      likesCount: "Likes",
                    }).map(([key, value]) => (
                      <FieldLabel htmlFor={key} key={key}>
                        <Field orientation="horizontal">
                          <FieldContent>
                            <FieldTitle className="mx-auto capitalize">
                              {key === "likesCount" ? (
                                <HeartIcon className="w-4" />
                              ) : (
                                <CalendarArrowDownIcon className="w-4" />
                              )}{" "}
                              {value}
                            </FieldTitle>
                          </FieldContent>
                          <RadioGroupItem
                            value={key}
                            id={key}
                            className="sr-only hidden"
                          />
                        </Field>
                      </FieldLabel>
                    ))}
                  </RadioGroup>
                </FieldSet>

                {(pathname.includes("everything") ||
                  pathname.includes("recipes") ||
                  pathname.includes("cookbooks")) && (
                  <FieldSet className="flex flex-col gap-2">
                    <FieldLegend variant="label">Category</FieldLegend>
                    <RadioGroup
                      className="grid w-full grid-cols-2 gap-2"
                      value={draftCategory || undefined}
                      onValueChange={(value) =>
                        setDraftCategory(value as Category)
                      }
                    >
                      {Object.entries(Category).map(([key, value]) => (
                        <FieldLabel htmlFor={value} key={key}>
                          <Field orientation="horizontal">
                            <FieldContent>
                              <FieldTitle>
                                {key === Category.MAIN_COURSE
                                  ? "Main Course"
                                  : capitalize(
                                      key.toLowerCase().replace(/_/g, " "),
                                    )}
                              </FieldTitle>
                            </FieldContent>
                            <RadioGroupItem value={value} id={value} />
                          </Field>
                        </FieldLabel>
                      ))}
                    </RadioGroup>
                  </FieldSet>
                )}

                <FieldSet className="flex flex-col gap-2">
                  <FieldLegend variant="label">Difficulty</FieldLegend>
                  <RadioGroup
                    className="grid w-full grid-cols-3 gap-2"
                    value={draftDifficulty || undefined}
                    onValueChange={(value) =>
                      setDraftDifficulty(value as Difficulty)
                    }
                  >
                    {Object.entries(Difficulty).map(([key, value]) => (
                      <FieldLabel htmlFor={value} key={key}>
                        <Field orientation="horizontal">
                          <FieldContent>
                            <FieldTitle className="mx-auto capitalize">
                              {key.toLowerCase()}
                            </FieldTitle>
                          </FieldContent>
                          <RadioGroupItem
                            value={value}
                            id={value}
                            className="sr-only hidden"
                          />
                        </Field>
                      </FieldLabel>
                    ))}
                  </RadioGroup>
                </FieldSet>
              </div>

              <DrawerFooter>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>

                <Button
                  onClick={() => {
                    setSkip(0);
                    setCategory(draftCategory);
                    setDifficulty(draftDifficulty);
                    setOrderBy(draftOrderBy);
                    setSearch("");
                    setDraftSearch("");
                    setOpenedDrawer(false);
                  }}
                >
                  Apply
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <div className="text-muted-foreground my-4 self-start text-sm">
        {pagination?.total || ""}{" "}
        {pagination ? (pagination.total === 1 ? "recipe" : "recipes") : " "}
      </div>

      <div className="mb-10 grid w-full max-w-400 grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isEditable={isEditable && recipe.authorId === authorId}
          />
        ))}
      </div>

      {recipes.length === 0 && (
        <div className="mb-10 flex h-full w-full items-center justify-center">
          <p className="text-muted-foreground text-center">No recipes found.</p>
        </div>
      )}

      {pagination && pagination.hasNextPage && (
        <div className="mb-10 flex justify-center">
          <Button
            disabled={isFetching}
            onClick={() => {
              setSkip((prev) => prev + pagination.take);
            }}
          >
            {isFetching ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
