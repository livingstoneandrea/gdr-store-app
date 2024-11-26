import React from "react";
import type { Metadata } from "next";
import { Poppins} from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["100","200", "200", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "Gdr Store App",
  description: "Google drive replica app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${poppins.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
