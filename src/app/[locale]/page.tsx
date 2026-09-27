import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "~/i18n/navigation";
import { CarouselMainCategory } from "~/components/home/carousel-main-category";
import { CategoriesNavbar } from "~/components/home/categories-navbar";
import { JsonLd } from "~/components/seo/json-ld";
import { Button } from "~/components/ui/button";
import { categories } from "~/lib/categories-list";
import { toLocale } from "~/lib/locales";
import { websiteJsonLd } from "~/lib/seo/json-ld";
import { buildPageMetadata } from "~/lib/seo/metadata";
import { SITE_NAME } from "~/lib/seo/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return buildPageMetadata({
    // The home page is the one title with room to explain what the site is, instead of only
    // repeating its name.
    title: { absolute: `${SITE_NAME} — ${t("tagline")}` },
    description: t("description"),
    path: "/",
    locale: toLocale(locale),
  });
}

export default async function Home() {
  const t = await getTranslations("Pages");
  const tCategories = await getTranslations("CategoryPages");
  const tMetadata = await getTranslations("Metadata");
  const locale = toLocale(await getLocale());

  const [
    explore,
    mains,
    starters,
    desserts,
    drinks,
    snacks,
    breakfast,
    everything,
  ] = categories;

  return (
    <>
      <JsonLd
        data={websiteJsonLd({
          locale,
          description: tMetadata("description"),
        })}
      />
      <CategoriesNavbar currentCategory="explore" />
      <div className="flex flex-col gap-5">
        <div className="relative flex h-[calc(100svh-12rem)] max-h-250 w-full items-center justify-center gap-4 px-10 py-16">
          <Image
            src="/images/lime-and-green-leaves.webp"
            alt={t("limeAndGreenLeaves")}
            fill
            className="absolute -z-10 object-cover"
          />

          <div className="flex h-full w-full flex-col text-gray-800 lg:flex-row">
            <div className="flex flex-1 flex-col items-center gap-4 px-2 lg:items-start">
              <h2 className="text-center text-5xl sm:text-7xl lg:text-left">
                {tCategories("mains.name")}
              </h2>
              <p className="max-w-125 text-center lg:text-left">
                {tCategories("mains.description")}
              </p>

              <div className="flex justify-center lg:justify-start">
                <Link href={mains?.href || "/mains"}>
                  <Button
                    variant="default"
                    size="lg"
                    className="hover:opacity-80"
                  >
                    {t("viewRecipes")}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex h-full flex-1 justify-center lg:flex-2 lg:justify-end">
              <CarouselMainCategory />
            </div>
          </div>
        </div>

        <div className="relative flex h-[calc(100svh-12rem)] max-h-220 w-full flex-col gap-5 lg:flex-row">
          <div className="relative flex-1">
            <Image
              src="/images/aperol-drink.webp"
              alt={t("aperolDrink")}
              fill
              className="absolute -z-10 object-cover"
            />

            <div className="flex flex-col items-center gap-5 p-5 text-white sm:p-15 lg:items-start">
              <h2 className="text-center text-5xl sm:text-7xl lg:text-left">
                {tCategories("drinks.name")}
              </h2>
              <p className="max-w-125 text-center lg:text-left">
                {tCategories("drinks.description")}
              </p>

              <div className="flex justify-center lg:justify-start">
                <Link href={drinks?.href || "/drinks"}>
                  <Button variant="secondary" size="lg">
                    {t("viewRecipes")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="relative flex flex-1">
            <Image
              src="/images/macarons.webp"
              alt={t("macarons")}
              fill
              className="absolute -z-10 object-cover"
            />

            <div className="flex w-full flex-col items-center gap-5 p-5 text-white sm:p-15 lg:items-start">
              <h2 className="text-center text-5xl sm:text-7xl lg:text-left">
                {tCategories("desserts.name")}
              </h2>
              <p className="max-w-125 text-center lg:text-left">
                {tCategories("desserts.description")}
              </p>

              <div className="flex justify-center lg:justify-start">
                <Link href={desserts?.href || "/desserts"}>
                  <Button variant="secondary" size="lg">
                    {t("viewRecipes")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-[calc(100svh-12rem)] max-h-220 w-full">
          <Image
            src={breakfast?.imageUrl || ""}
            alt={t("picnic")}
            fill
            className="absolute -z-10 object-cover"
          />

          <div className="flex flex-col items-center gap-5 p-5 text-white sm:p-15 lg:items-start">
            <h2 className="text-center text-5xl sm:text-7xl lg:text-left">
              {tCategories("breakfast.name")}
            </h2>
            <p className="max-w-125 text-center lg:text-left">
              {tCategories("breakfast.description")}
            </p>

            <div className="flex justify-center lg:justify-start">
              <Link href={breakfast?.href || "/breakfast"}>
                <Button variant="secondary" size="lg">
                  {t("viewRecipes")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
