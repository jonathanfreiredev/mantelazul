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
    name: "sides",
    href: "/sides",
    imageUrl: "/images/baked-tuna-pasta.webp",
    description:
      "Discover our collection of delicious side dishes, from crispy roasted vegetables to creamy mashed potatoes.",
  },
  {
    name: "everything",
    href: "/everything",
    imageUrl: "/images/picnic.webp",
    description:
      "Explore our diverse collection of recipes, featuring mains, desserts, drinks, and sides to inspire your culinary adventures.",
  },
];
