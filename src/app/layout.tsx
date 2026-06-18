import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HOA Manager",
  description: "Professional HOA management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className="h-full">
      <body className="h-full bg-gray-50 text-gray-900 antialiased" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
