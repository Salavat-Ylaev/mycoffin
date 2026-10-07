import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { SITE_URL, BRAND, GOOGLE_VERIFICATION, GA_ID } from "@/lib/seo";
import "./globals.css";

const TITLE = `${BRAND} — труни для улюбленців на замовлення`;
const DESCRIPTION =
  "Труни ручної роботи для котів, собак, рептилій і гризунів. Стандартні розміри " +
  "в наявності, відправка того ж дня. Розрахунок розміру за вагою, гравіювання " +
  "імені та дат, доставка по Україні.";

export const metadata: Metadata = {
  // metadataBase робить усі відносні адреси абсолютними:
  // без нього canonical і og:image виходять битими
  metadataBase: new URL(SITE_URL),

  title: {
    default: TITLE,
    template: `%s — ${BRAND}`,
  },
  description: DESCRIPTION,
  applicationName: BRAND,

  // канонічна адреса — щоб www і vercel.app не вважалися окремими сайтами
  alternates: { canonical: "/" },

  openGraph: {
    type: "website",
    siteName: BRAND,
    locale: "uk_UA",
    url: "/",
    title: `${BRAND} — труни для улюбленців`,
    description: "Гідне прощання для того, хто був родиною.",
  },

  twitter: {
    card: "summary_large_image",
    title: `${BRAND} — труни для улюбленців`,
    description: "Гідне прощання для того, хто був родиною.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // код з Search Console → метод «HTML-тег». Якщо змінної немає, тег не виводиться
  verification: GOOGLE_VERIFICATION ? { google: GOOGLE_VERIFICATION } : undefined,

  category: "shopping",
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
      <body>
        {children}

        {/* Google Analytics 4 — підключається лише коли задано NEXT_PUBLIC_GA_ID */}
        {GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config','${GA_ID}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
