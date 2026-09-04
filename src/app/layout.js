import { Manrope } from "next/font/google";
import "./globals.css";

/* The mobile app bundles Manrope-{Regular,Medium,SemiBold,Bold,ExtraBold}.ttf.
   Those are weights 400/500/600/700/800 — declared here so the web renders the
   identical typeface. next/font self-hosts it, so there is no Google request at
   runtime and no flash of fallback text. */
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "CrewApply — Maritime jobs for seafarers",
    template: "%s · CrewApply",
  },
  description:
    "Find and apply for maritime jobs across deck, engine, catering and hospitality departments. Build your seafarer profile once and apply in a tap.",
};

/* The app is portrait-first and has no dark mode; both are stated here rather
   than left to the browser to guess. */
export const viewport = {
  themeColor: "#056DEC",
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${manrope.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
