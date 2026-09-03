import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ServiceTag } from "@/lib/types";
import { getStoresByTag } from "@/lib/data";
import { StoreCard } from "@/components/StoreCard";

const TAGS: Record<ServiceTag, string> = {
  takeaway: "Takeaway",
  delivery: "Delivery",
  "dine-in": "Dine-in",
};

export function generateStaticParams() {
  return (Object.keys(TAGS) as ServiceTag[]).map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const label = TAGS[tag as ServiceTag];
  if (!label) return {};
  return {
    title: `${label} stores in Singapore`,
    description: `Singapore stores offering ${label.toLowerCase()} that you can order from ahead.`,
    alternates: { canonical: `/tag/${tag}` },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const label = TAGS[tag as ServiceTag];
  if (!label) notFound();

  const stores = await getStoresByTag(tag as ServiceTag);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">{label}</h1>
      <p className="mb-6 text-stone-600 dark:text-stone-400">
        {stores.length} {stores.length === 1 ? "store" : "stores"} offering {label.toLowerCase()}.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <StoreCard key={store.slug} store={store} />
        ))}
      </div>
    </div>
  );
}
