export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL ?? process.env.SITE_URL ?? "https://ideal-deer-371.convex.site",
      applicationID: "convex",
    },
  ],
};
