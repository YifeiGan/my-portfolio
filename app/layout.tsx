import type { Metadata } from "next";
import {
  Geist, 
  Geist_Mono, 
  Bebas_Neue,
  Racing_Sans_One,
  Lora,
  EB_Garamond } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas", 
});

const racing = Racing_Sans_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-racing",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});


export const metadata: Metadata = {
  title: "Yifei's Comfort Zone",
  description: "做个好梦",
  icons: {
    icon: "/web_logo.png",
    apple: "/web_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebas.variable} ${racing.variable} ${lora.variable}${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
