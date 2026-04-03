import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // מונע בחירת שורש שגוי בגלל package-lock.json בהום; מונע סריקת iCloud שלא מותרת ל-Turbopack
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
