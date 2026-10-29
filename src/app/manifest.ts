import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sari-Sari Store POS & Paninda",
    short_name: "SariSari POS",
    description: "Mobile-first POS, barcode price scanner, at utang ledger para sa sari-sari store.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#134e4a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/ek-sss.jpg",
        sizes: "360x360",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}
