import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sponsorum.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${APP_URL}/`,                    lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${APP_URL}/search`,              lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${APP_URL}/login`,               lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${APP_URL}/register`,            lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${APP_URL}/kullanim-sartlari`,   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${APP_URL}/gizlilik-politikasi`, lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${APP_URL}/kvkk`,                lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${APP_URL}/cerez-politikasi`,    lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
