import localFont from "next/font/local";
import { Poppins } from "next/font/google";

// Brand type system (design-system/tokens/fonts.css):
// Stinger = display/headings, Basic Sans = body/UI, Poppins = big stat numerals.
export const stinger = localFont({
  src: [
    { path: "../fonts/StingerTrial-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/StingerTrial-Bold.ttf", weight: "700", style: "normal" },
    { path: "../fonts/StingerTrial-Heavy.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-stinger",
  display: "swap",
});

export const basicSans = localFont({
  src: [
    { path: "../fonts/BasicSansSF.ttf", weight: "400", style: "normal" },
    { path: "../fonts/BasicSansSF-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-basic-sans",
  display: "swap",
});

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-poppins",
  display: "swap",
});
