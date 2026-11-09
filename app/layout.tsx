import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: { default: "Eventually · Plan your Cebu celebration", template: "%s · Eventually" },
  description:
    "Discover Cebu vendors, browse curated packages, request quotes and book, all in one place. Debuts, weddings, christenings and fiestas.",
  applicationName: "Eventually",
};

export const viewport: Viewport = {
  themeColor: "#faf8f7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body>
        <div className="mx-auto min-h-dvh max-w-[440px] bg-cream shadow-[0_0_0_1px_var(--color-line)] sm:my-0">
          {children}
        </div>
      </body>
    </html>
  );
}
