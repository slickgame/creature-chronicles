import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Creature Chronicles",
    short_name: "Chronicles",
    description: "Manage the ranch, raise creatures, and defend it in tactical 3v3 battles.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#080b0f",
    theme_color: "#10151b",
    icons: [
      {
        src: "/images/ui/icons/icon_paw_crest.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
