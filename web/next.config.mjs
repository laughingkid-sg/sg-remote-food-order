/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static site: `next build` emits a static `out/` folder (deployed to
  // Cloudflare Pages). Store data is fetched from Supabase during the build;
  // trigger a rebuild when data changes.
  output: "export",
  reactStrictMode: true,
  // Required for static export since there is no image optimization server.
  images: { unoptimized: true },
};

export default nextConfig;
