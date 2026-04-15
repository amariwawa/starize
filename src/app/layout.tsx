import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STARIZE — Gospel Talent Hunt Season 7",
  description: "Discovering the next generation of gospel talent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@24,400,0..1&display=swap"
          rel="stylesheet"
        />
        <link rel="preload" as="image" href="/images/hero-bg.jpg" />
      </head>
      <body className="bg-surface-dim text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container" style={{ overflowX: 'clip' }}>
        <div style={{ overflowX: 'clip', maxWidth: '100%', width: '100%' }} className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
