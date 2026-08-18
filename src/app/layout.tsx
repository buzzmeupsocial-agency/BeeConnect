import type { Metadata } from "next";
import { stinger, basicSans, poppins } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeeConnect",
  description: "Investimento, leads/compras, campanhas e criativos — Meta Ads e Google Ads",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${stinger.variable} ${basicSans.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
