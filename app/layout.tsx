import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPOKIY — труни для улюбленців на замовлення",
  description:
    "Труни ручної роботи для котів, собак, рептилій і гризунів. Розрахунок розміру за вагою, виготовлення 1–3 дні, доставка по Україні.",
  openGraph: {
    title: "SPOKIY — труни для улюбленців",
    description: "Гідне прощання для того, хто був родиною.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbfaf8",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk">
      <head>
        {/* Шрифти підвантажуються у браузері — збірка не залежить від мережі */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Commissioner:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
