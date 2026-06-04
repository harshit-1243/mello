import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { SITE } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const description =
  "Mello is a 24/7 AI receptionist for sports facilities. It answers every call in Hindi and English, checks live availability, and confirms the booking before the caller hangs up.";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${SITE.domain}`),
  title: {
    default: "mello — Never lose a booking to a missed call",
    template: "%s · mello",
  },
  description,
  keywords: [
    "AI receptionist",
    "sports facility booking",
    "turf booking",
    "voice AI",
    "Hindi English voice bot",
    "24/7 call answering",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: `https://${SITE.domain}`,
    siteName: "mello",
    title: "mello — Never lose a booking to a missed call",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "mello — Never lose a booking to a missed call",
    description,
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F3EE" },
    { media: "(prefers-color-scheme: dark)", color: "#0D100C" },
  ],
  colorScheme: "light",
};

// Runs synchronously before paint: enables FOUC-free reveals only when JS is
// on AND the visitor hasn't asked for reduced motion.
const animFlag = `(function(){try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('anim');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="relative min-h-dvh">
        <script dangerouslySetInnerHTML={{ __html: animFlag }} />
        <div className="grain-layer" aria-hidden="true" />
        <CustomCursor />
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
