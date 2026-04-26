import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const plexSans = IBM_Plex_Sans({ 
  weight: ['400', '500', '600', '700'], 
  subsets: ["latin"],
  variable: '--font-plex-sans'
});
const plexMono = IBM_Plex_Mono({ 
  weight: ['400', '500', '600', '700'], 
  subsets: ["latin"],
  variable: '--font-plex-mono'
});

export const metadata: Metadata = {
  title: "Market Intelligence | Chronological Reports",
  description: "A lightweight platform for navigating tactical market intelligence reports by date.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} ${plexSans.variable} ${plexMono.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
