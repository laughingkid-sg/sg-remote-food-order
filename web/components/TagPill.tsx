import Link from "next/link";
import type { ServiceTag, StoreType } from "@/lib/types";

const TAG_LABELS: Record<ServiceTag, string> = {
  takeaway: "Takeaway",
  delivery: "Delivery",
  "dine-in": "Dine-in",
};

export function ServiceTagPill({ tag, href }: { tag: ServiceTag; href?: string }) {
  const label = TAG_LABELS[tag];
  const className =
    "inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300";
  return href ? (
    <Link href={href} className={`${className} hover:bg-stone-200 dark:hover:bg-stone-700`}>
      {label}
    </Link>
  ) : (
    <span className={className}>{label}</span>
  );
}

/** Store type is visually distinct from service tags. */
export function TypePill({ type }: { type: StoreType }) {
  const isApp = type === "app";
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold " +
        (isApp
          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300")
      }
    >
      {isApp ? "App" : "Order Link"}
    </span>
  );
}
