import type { Metadata } from "next";
import "./globals.css";
import { OfflineBanner } from "@/components/OfflineBanner";`nimport SchemaOrg from "@/components/SchemaOrg";

export const metadata: Metadata = {
  title: "Cape Parts Finder | Find Car Parts in Cape Town",
  description: "Looking for vehicle parts in Cape Town? Submit your request and get connected with trusted local suppliers fast. Free service covering all areas of Cape Town.",
  keywords: "car parts Cape Town, vehicle parts Cape Town, auto parts Cape Town, second hand parts Cape Town, scrap yard Cape Town, brake pads Cape Town, engine parts Cape Town",
  openGraph: {
    title: "Cape Parts Finder | Find Car Parts in Cape Town",
    description: "Find vehicle parts in Cape Town fast. Connect with trusted local suppliers.",
    url: "https://capepartsfinder.co.za",
    siteName: "Cape Parts Finder",
    locale: "en_ZA",
    type: "website",
  },
};

const schemaOrg = {`"@context`":`"https://schema.org`",`"@type`":`"AutoPartsStore`",`"name`":`"Cape Parts Finder`",`"url`":`"https://www.capepartsfinder.co.za`",`"telephone`":`"+27696863952`",`"address`":{`"@type`":`"PostalAddress`",`"addressLocality`":`"Cape Town`",`"addressRegion`":`"Western Cape`",`"addressCountry`":`"ZA`"},`"description`":`"Cape Parts Finder sources vehicle parts for Cape Town customers via a trusted supplier network.`"};
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
      <link rel="manifest" href="/manifest.json" /><SchemaOrg />
      <script type=\"application/ld+json\">{\"@context\":\"https://schema.org\",\"@type\":\"AutoPartsStore\",\"name\":\"Cape Parts Finder\",\"url\":\"https://www.capepartsfinder.co.za\",\"telephone\":\"+27696863952\",\"address\":{\"@type\":\"PostalAddress\",\"addressLocality\":\"Cape Town\",\"addressRegion\":\"Western Cape\",\"addressCountry\":\"ZA\"},\"geo\":{\"@type\":\"GeoCoordinates\",\"latitude\":-33.9249,\"longitude\":18.4241},\"openingHours\":\"Mo-Fr 08:00-17:00\",\"priceRange\":\"R\",\"description\":\"Cape Parts Finder sources vehicle parts for Cape Town customers via a trusted supplier network.\",\"areaServed\":{\"@type\":\"City\",\"name\":\"Cape Town\"}}</script>
      <link rel="apple-touch-icon" href="/icon-192.png" /></head>
      <body style={{overflowX:"hidden",maxWidth:"100vw"}}>
      <script dangerouslySetInnerHTML={{__html: `if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{});})}` }} /><OfflineBanner />{children}</body>
    </html>
  );
}