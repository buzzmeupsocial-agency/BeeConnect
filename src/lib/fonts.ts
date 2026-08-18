import localFont from "next/font/local";

// BuzzConnect type system (buzzconnect/tokens/typography.css): Stinger only
// for page/tab titles, Basic Sans for everything else — including KPI
// values and numerals (Poppins is exclusive to the BuzzMeUp marketing
// design system's big social-post stats, not used in the product UI).
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
