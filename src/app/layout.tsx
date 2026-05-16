import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
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
        <ClerkProvider>
          <header className="flex items-center justify-end p-4 bg-white/50 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <Show when="signed-out">
                <div className="flex gap-2">
                  <SignInButton mode="modal" />
                  <SignUpButton mode="modal" />
                </div>
              </Show>
              <Show when="signed-in">
                <UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9" } }} />
              </Show>
            </div>
          </header>
          <main>
            {children}
          </main>
        </ClerkProvider>
      </body>
    </html>
  );
}
