import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdCraft — AI Product Ad Generator",
  description: "Transform product photos into stunning ad creatives with AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
