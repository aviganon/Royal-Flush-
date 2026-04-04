import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Royal Flush Poker",
    short_name: "Royal Flush",
    description: "פוקר אונליין פרמיום עם גרפיקה מתקדמת ומשחק בזמן אמת",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d1117",
    theme_color: "#0d1117",
    categories: ["games", "entertainment"],
    lang: "he",
    dir: "rtl",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: "לובי משחקים",
        short_name: "לובי",
        description: "כניסה ישירה ללובי",
        url: "/?view=lobby",
        icons: [{ src: "/apple-icon.png", sizes: "180x180" }],
      },
      {
        name: "ארנק",
        short_name: "ארנק",
        description: "ניהול צ׳יפים",
        url: "/?view=wallet",
        icons: [{ src: "/apple-icon.png", sizes: "180x180" }],
      },
    ],
  };
}
