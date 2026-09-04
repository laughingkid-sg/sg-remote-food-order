import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const webDirectory = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(webDirectory, "public", "store-logos");
const logoSize = 128;
const logoQuality = 84;

async function loadEnvFile(filePath) {
  try {
    const contents = await readFile(filePath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;

      let value = match[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

await loadEnvFile(path.join(webDirectory, ".env"));
await loadEnvFile(path.join(webDirectory, ".env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

await rm(outputDirectory, { recursive: true, force: true });

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("Supabase is not configured; no store logos to bundle.");
  process.exit(0);
}

const storesUrl = new URL(`${supabaseUrl}/rest/v1/stores`);
storesUrl.searchParams.set("select", "slug,logo_url");
storesUrl.searchParams.set("logo_url", "not.is.null");

const response = await fetch(storesUrl, {
  headers: {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  },
});

if (!response.ok) {
  throw new Error(`Failed to load store logos: ${response.status} ${response.statusText}`);
}

const stores = await response.json();
if (!Array.isArray(stores)) {
  throw new Error("Failed to load store logos: Supabase returned an invalid response.");
}

await mkdir(outputDirectory, { recursive: true });

for (const store of stores) {
  if (
    typeof store.slug !== "string" ||
    !/^[a-z0-9-]+$/.test(store.slug) ||
    typeof store.logo_url !== "string"
  ) {
    throw new Error("Failed to load store logos: Supabase returned an invalid store row.");
  }

  const imageResponse = await fetch(store.logo_url);
  if (!imageResponse.ok) {
    throw new Error(
      `Failed to download logo for ${store.slug}: ${imageResponse.status} ${imageResponse.statusText}`,
    );
  }

  const source = Buffer.from(await imageResponse.arrayBuffer());
  await sharp(source)
    .resize({
      width: logoSize,
      height: logoSize,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .webp({ quality: logoQuality })
    .toFile(path.join(outputDirectory, `${store.slug}.webp`));
}

console.log(`Bundled ${stores.length} store logo${stores.length === 1 ? "" : "s"}.`);
