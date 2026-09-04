import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreBySlug, getStores } from "@/lib/data";
import { REGION_BY_SLUG } from "@/data/regions";
import { SITE } from "@/lib/site";
import { ServiceTagPill, TypePill } from "@/components/TagPill";

export async function generateStaticParams() {
  const stores = await getStores();
  return stores.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return {};

  return {
    title: store.name,
    description: store.description,
    alternates: { canonical: `/store/${store.slug}` },
    openGraph: {
      title: store.name,
      description: store.description,
      url: `${SITE.url}/store/${store.slug}`,
    },
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const region = REGION_BY_SLUG.get(store.region);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: store.name,
    servesCuisine: store.cuisine,
    ...(store.address ? { address: store.address } : {}),
    areaServed: region?.name,
    url: `${SITE.url}/store/${store.slug}`,
  };

  return (
    <article className="mx-auto max-w-2xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/" className="text-sm text-stone-500 hover:underline">
        ← All stores
      </Link>

      <header className="mt-4 mb-6">
        <div className="mb-2 flex items-center gap-2">
          <TypePill type={store.type} />
          {region && (
            <span className="text-sm text-stone-500">
              {store.area && <span>{store.area}, </span>}
              <Link href={`/region/${region.slug}`} className="hover:underline">
                {region.name}
              </Link>
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{store.name}</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">{store.cuisine}</p>
      </header>

      <p className="mb-6 text-stone-700 dark:text-stone-300">{store.description}</p>

      {store.address && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Address
          </h2>
          <p className="mt-1 text-stone-700 dark:text-stone-300">{store.address}</p>
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-1.5">
        {store.tags.map((tag) => (
          <ServiceTagPill key={tag} tag={tag} href={`/tag/${tag}`} />
        ))}
      </div>

      {/* CTA differs by store type. */}
      {store.type === "qr" && store.orderUrl && (
        <a
          href={store.orderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          Order now →
        </a>
      )}

      {store.type === "app" && (
        <div className="flex flex-wrap gap-3">
          {store.appIosUrl && (
            <a
              href={store.appIosUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-5 py-3 font-semibold text-white transition hover:bg-stone-800 dark:bg-white dark:text-stone-900"
            >
               Download on iOS
            </a>
          )}
          {store.appAndroidUrl && (
            <a
              href={store.appAndroidUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-5 py-3 font-semibold text-white transition hover:bg-stone-800 dark:bg-white dark:text-stone-900"
            >
              ▶ Get it on Android
            </a>
          )}
        </div>
      )}
    </article>
  );
}
