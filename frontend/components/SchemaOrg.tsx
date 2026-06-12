export default function SchemaOrg() {
  const data = {
    "@context": "https://schema.org",
    "@type": "AutoPartsStore",
    "@name": "Cape Parts Finder",
    "url": "https://www.capepartsfinder.co.za",
    "telephone": "+27696863952",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Cape Town",
      "addressRegion": "Western Cape",
      "addressCountry": "ZA"
    },
    "description": "Cape Parts Finder sources vehicle parts for Cape Town customers via a trusted supplier network."
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
