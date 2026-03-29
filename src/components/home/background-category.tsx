import Image from "next/image";

export function BackgroundCategory() {
  return (
    <div className="relative flex h-screen w-full items-center justify-center gap-4">
      <Image
        src="/images/lime-and-green-leaves.webp"
        alt="Lime and green leaves"
        fill
        className="object-cover object-center"
      />

      <div className="absolute z-10 flex h-full items-center justify-center">
        <h1 className="text-3xl font-bold">Welcome to Mantel Azul!</h1>
      </div>
    </div>
  );
}
