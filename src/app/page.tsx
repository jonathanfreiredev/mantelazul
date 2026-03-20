import Image from "next/image";
import Link from "next/link";
import { CarouselMainCategory } from "~/components/home/carousel-main-category";
import { CategoriesNavbar } from "~/components/home/categories-navbar";
import { Button } from "~/components/ui/button";
import { categories } from "~/lib/categories-list";
import { capitalize } from "~/lib/utils";

export default async function Home() {
  const [explore, mains, desserts, drinks, sides, everything] = categories;

  return (
    <main className="">
      <CategoriesNavbar currentCategory="explore" />
      <div className="flex flex-col gap-5">
        <div className="relative flex h-[calc(100vh-12rem)] w-full items-center justify-center gap-4 px-10 py-16">
          <Image
            src="/images/lime-and-green-leaves.webp"
            alt="Lime and green leaves"
            fill
            className="absolute -z-10 object-cover"
          />

          <div className="flex h-full w-full flex-col text-gray-800 lg:flex-row">
            <div className="flex flex-1 flex-col items-center gap-4 px-2 lg:items-start">
              <h2 className="text-center text-5xl sm:text-7xl lg:text-left">
                {capitalize(mains?.name || "mains")}
              </h2>
              <p className="max-w-125 text-center lg:text-left">
                {mains?.description}
              </p>

              <div className="flex justify-center lg:justify-start">
                <Link href={mains?.href || "/mains"}>
                  <Button
                    variant="default"
                    size="lg"
                    className="hover:opacity-80"
                  >
                    View recipes
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex h-full flex-1 justify-center lg:flex-2 lg:justify-end">
              <CarouselMainCategory />
            </div>
          </div>
        </div>

        <div className="relative flex h-[calc(100vh-12rem)] w-full flex-col gap-5 lg:flex-row">
          <div className="relative flex-1">
            <Image
              src="/images/aperol-drink.webp"
              alt="Aperol drink"
              fill
              className="absolute -z-10 object-cover"
            />

            <div className="flex flex-col items-center gap-5 p-5 text-white sm:p-15 lg:items-start">
              <h2 className="text-center text-5xl sm:text-7xl lg:text-left">
                {capitalize(drinks?.name || "drinks")}
              </h2>
              <p className="max-w-125 text-center lg:text-left">
                {drinks?.description}
              </p>

              <div className="flex justify-center lg:justify-start">
                <Link href={drinks?.href || "/drinks"}>
                  <Button variant="secondary" size="lg">
                    View recipes
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="relative flex flex-1">
            <Image
              src="/images/macarons.webp"
              alt="Macarons"
              fill
              className="absolute -z-10 object-cover"
            />

            <div className="flex w-full flex-col items-center gap-5 p-5 text-white sm:p-15 lg:items-start">
              <h2 className="text-center text-5xl sm:text-7xl lg:text-left">
                {capitalize(desserts?.name || "desserts")}
              </h2>
              <p className="max-w-125 text-center lg:text-left">
                {desserts?.description}
              </p>

              <div className="flex justify-center lg:justify-start">
                <Link href={desserts?.href || "/desserts"}>
                  <Button variant="secondary" size="lg">
                    View recipes
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-[calc(100vh-12rem)] w-full">
          <Image
            src="/images/baked-tuna-pasta.webp"
            alt="Baked tuna pasta"
            fill
            className="absolute -z-10 object-cover"
          />

          <div className="flex flex-col items-center gap-5 p-5 text-white sm:p-15 lg:items-start">
            <h2 className="text-center text-5xl sm:text-7xl lg:text-left">
              {capitalize(sides?.name || "sides")}
            </h2>
            <p className="max-w-125 text-center lg:text-left">
              {sides?.description}
            </p>

            <div className="flex justify-center lg:justify-start">
              <Link href={sides?.href || "/sides"}>
                <Button variant="secondary" size="lg">
                  View recipes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
