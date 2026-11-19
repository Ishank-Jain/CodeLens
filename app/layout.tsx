import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

import "./globals.css";
import ConvexClientProvider from "@/components/provider/ConvexClientProvider";
import { dark } from "@clerk/themes";

export const metadata: Metadata = {
  title: "Code Lens AI",
  description: "Code Lens AI - AI-Powered Code Review Assistant",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
      }}
    >
      <ConvexClientProvider>
        <html lang="en" suppressHydrationWarning>
          <body
            className={`min-h-screen flex flex-col bg-gray-900 text-gray-200 font-sans hide-scrollbar`}
          >
            <Toaster />
            {children}
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
