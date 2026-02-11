import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Obwira Admin",
  description: "Tableau de bord d'administration",
  icons: {
    icon: "/logo_obwira.png",
    shortcut: "/logo_obwira.png",
    apple: "/logo_obwira.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${playfair.variable} ${montserrat.variable} antialiased bg-primary-black text-white font-montserrat`}
      >
        {children}
      </body>
    </html>
  );
}
