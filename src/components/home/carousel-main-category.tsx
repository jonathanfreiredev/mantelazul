"use client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
} from "../ui/carousel";
import Image from "next/image";

const mains = [
  { name: "Bibimbap", image: "/images/bibimbap.webp" },
  {
    name: "burger",
    image: "/images/burger.webp",
  },
  {
    name: "pizza-quattro-formaggi",
    image: "/images/pizza-quattro-formaggi.webp",
  },
  {
    name: "salmon-fillet-roasted",
    image: "/images/salmon-fillet-roasted.webp",
  },
];

export function CarouselMainCategory() {
  console.log("Rendering CarouselMainCategory with mains");
  return (
    <div className="relative h-full w-full">
      <Carousel className="h-full w-full">
        <CarouselContent className="-ml-1 h-full">
          {mains.map((dish, index) => (
            <CarouselItem
              key={index}
              className="h-full basis-1/2 sm:basis-1/3 2xl:basis-1/4"
            >
              <div className="relative box-border flex h-full items-center justify-center shadow-xl">
                <Image
                  src={dish.image}
                  alt={dish.name}
                  fill
                  className="rounded-sm object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselNext
          variant="secondary"
          size="icon-lg"
          className="right-0 z-30"
        />
      </Carousel>
      <div className="pointer-events-none absolute top-0 right-0 z-20 h-full w-12 bg-linear-to-l from-gray-300/60 to-transparent" />{" "}
    </div>
  );
}
