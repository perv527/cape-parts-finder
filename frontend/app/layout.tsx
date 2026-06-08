import type { Metadata } from "next";
import "./globals.css";
import { OfflineBanner } from "@/components/OfflineBanner";

export const metadata: Metadata = {
  title: "Cape Parts Finder | Find Car Parts in Cape Town",
  description: "Looking for vehicle parts in Cape Town? Submit your request and get connected with trusted local suppliers fast. Free service covering all areas of Cape Town.",
  keywords: "car parts Cape Town, vehicle parts Cape Town, auto parts Cape Town, second hand parts Cape Town, scrap yard Cape Town, brake pads Cape Town, engine parts Cape Town",
  openGraph: {
    title: "Cape Parts Finder | Find Car Parts in Cape Town",
    description: "Find vehicle parts in Cape Town fast. Connect with trusted local suppliers.",
    url: "https://cape-parts-finder.vercel.app",
    siteName: "Cape Parts Finder",
    locale: "en_ZA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
      <meta name="theme-color" content="#f97316" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Parts Finder" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/icon-192.png" /></head>
      <body style={{overflowX:"hidden",maxWidth:"100vw"}}>
      <script dangerouslySetInnerHTML={{__html: `if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{});})}` }} /><OfflineBanner />{children}</body>
    </html>
  );
}