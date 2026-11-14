import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: "https://vadzim-papkou.by/",
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
      alternates: {
        languages: {
          ru: "https://vadzim-papkou.by/",
          en: "https://vadzim-papkou.by/en/",
        },
      },
    },
    {
      url: "https://vadzim-papkou.by/en/",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: {
          ru: "https://vadzim-papkou.by/",
          en: "https://vadzim-papkou.by/en/",
        },
      },
    },
  ];
}
