import Image from "next/image";
import { getTranslations } from "next-intl/server";

export async function BackgroundCategory() {
  const t = await getTranslations("Pages");

  return (
    <div className="relative flex h-screen w-full items-center justify-center gap-4">
      <Image
        src="/images/lime-and-green-leaves.webp"
        alt={t("limeAndGreenLeaves")}
        fill
        className="object-cover object-center"
      />

      <div className="absolute z-10 flex h-full items-center justify-center">
        <h1 className="text-3xl font-bold">{t("welcome")}</h1>
      </div>
    </div>
  );
}
