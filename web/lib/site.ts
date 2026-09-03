/** Site-wide constants used for metadata, canonical URLs and the sitemap. */
export const SITE = {
  name: "SG Remote Food Order",
  description:
    "Search Singapore stores you can order from before you arrive — scan-to-order QR spots and app-based chains, by region.",
  // Override with NEXT_PUBLIC_SITE_URL in production for correct canonical URLs.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sg-remote-food-order.example.com",
};
