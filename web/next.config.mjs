/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pages are statically generated at build time for SEO. Store data is fetched
  // from Supabase during `next build`; trigger a rebuild when data changes.
  reactStrictMode: true,
};

export default nextConfig;
