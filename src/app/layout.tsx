import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sponsorum.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Sponsorum - Türkiye'nin Anonim Influencer Sponsorluk Pazaryeri",
  description:
    "Markalar ve yayıncılar anonim olarak buluşur. X, Instagram, TikTok, YouTube, Kick ve Twitch yayıncılarıyla güvenli sponsorluk anlaşmaları yap.",
  keywords: [
    "influencer marketing",
    "sponsorluk",
    "yayıncı",
    "marka",
    "reklam",
    "Türkiye",
  ],
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    title: "Sponsorum - Türkiye'nin Anonim Influencer Sponsorluk Pazaryeri",
    description:
      "Markalar ve yayıncılar anonim olarak buluşur. X, Instagram, TikTok, YouTube, Kick ve Twitch yayıncılarıyla güvenli sponsorluk anlaşmaları yap.",
    url: APP_URL,
    siteName: "Sponsorum",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sponsorum - Türkiye'nin Anonim Influencer Sponsorluk Pazaryeri",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sponsorum - Türkiye'nin Anonim Influencer Sponsorluk Pazaryeri",
    description:
      "Markalar ve yayıncılar anonim olarak buluşur. X, Instagram, TikTok, YouTube, Kick ve Twitch yayıncılarıyla güvenli sponsorluk anlaşmaları yap.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
