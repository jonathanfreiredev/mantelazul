export type CategoryPage = {
  name: string;
  href: string;
  imageUrl: string;
  description: string;
};

export const categories: CategoryPage[] = [
  {
    name: "explore",
    href: "/",
    imageUrl: "/images/lime-and-green-leaves.webp",
    description: "",
  },
  {
    name: "mains",
    href: "/mains",
    imageUrl: "/images/lime-and-green-leaves.webp",
    description:
      "Discover our collection of main dishes with a variety of flavors and ingredients to satisfy every palate.",
  },
  {
    name: "starters",
    href: "/starters",
    imageUrl: "/images/fries-food.webp",
    description:
      "Kick off your meal with our delicious starter recipes, featuring a variety of flavors and ingredients to tantalize your taste buds.",
  },
  {
    name: "desserts",
    href: "/desserts",
    imageUrl: "/images/macarons.webp",
    description:
      "Indulge in our delectable desserts, from rich chocolate treats to light and fruity delights.",
  },
  {
    name: "drinks",
    href: "/drinks",
    imageUrl: "/images/aperol-drink.webp",
    description:
      "Quench your thirst with our refreshing drink recipes, from vibrant cocktails to soothing mocktails.",
  },
  {
    name: "snacks",
    href: "/snacks",
    imageUrl: "/images/snack.webp",
    description:
      "Satisfy your cravings with our delicious snack recipes, perfect for any time of day.",
  },
  {
    name: "breakfast",
    href: "/breakfast",
    imageUrl: "/images/breakfast.webp",
    description:
      "Start your day with our delicious breakfast recipes, featuring a variety of options to energize your mornings.",
  },
  {
    name: "everything",
    href: "/everything",
    imageUrl: "/images/picnic.webp",
    description:
      "Explore our diverse collection of recipes, featuring mains, desserts, drinks, and sides to inspire your culinary adventures.",
  },
];
