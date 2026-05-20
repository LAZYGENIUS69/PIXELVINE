import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/theme/provider";
import { Toaster } from "@/components/ui/toaster"
import { ConvexAuthProvider } from "@/src/convex/provider";
import { Navbar } from "@/components/navbar";
import { ReduxProvider } from "@/store/provider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pixelvine.ai"),

  title: {
    default: "PIXELVINE — Deep Design Engineering Agent",
    template: "%s · PIXELVINE",
  },

  description:
    "PIXELVINE is a deep design engineering agent that generates, critiques, and self-corrects production-grade UI systems. Go from prompt to pixel-perfect, auditable, and exportable UI with multi-agent intelligence.",

  applicationName: "PIXELVINE",

  keywords: [
    "AI UI Generator",
    "AI UX Generator",
    "Design Engineering",
    "Multi-Agent AI",
    "Tailwind UI Generator",
    "React UI Generator",
    "Design to Code",
    "AI SaaS Builder",
    "Self-Correcting AI",
    "UX Audit AI",
    "Frontend Automation",
  ],

  authors: [{ name: "PIXELVINE Labs" }],
  creator: "PIXELVINE Labs",
  publisher: "PIXELVINE Labs",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    url: "https://pixelvine.ai",
    title: "PIXELVINE — Deep Design Engineering Agent",
    description:
      "Generate, critique, and refactor UI systems using a multi-agent AI loop. PIXELVINE goes beyond design-to-code with automated UX auditing and self-correction.",
    siteName: "PIXELVINE",
    images: [
      {
        url: "/og/pixelvine-og.png",
        width: 1200,
        height: 630,
        alt: "PIXELVINE Deep Design Engineering Agent",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "PIXELVINE — Deep Design Engineering Agent",
    description:
      "A multi-agent AI that designs, audits, and self-corrects UI systems. From prompt to production-ready frontend.",
    images: ["/og/pixelvine-og.png"],
    creator: "@pixelvineai",
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/site.webmanifest",

  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReduxProvider>
            <ConvexAuthProvider>
              <Navbar />
              {children}
              <Toaster />
            </ConvexAuthProvider>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
