import { notFound } from "next/navigation";
import { Cookbook } from "~/components/cookbooks/cookbook";
import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

interface CookbookPageProps {
  params: Promise<{ cookbookId: string }>;
}

export default async function CookbookPage({ params }: CookbookPageProps) {
  const [{ cookbookId }, session] = await Promise.all([params, getSession()]);

  if (!session) {
    notFound();
  }

  try {
    await api.cookbooks.getOne({
      id: cookbookId,
    });
  } catch (error) {
    notFound();
  }

  return <Cookbook cookbookId={cookbookId} />;
}
