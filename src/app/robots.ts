import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/post/", "/stocks/"],
        disallow: ["/api/", "/auth/", "/onboarding"],
      },
    ],
    sitemap: "https://www.huat.co/sitemap.xml",
  };
}
