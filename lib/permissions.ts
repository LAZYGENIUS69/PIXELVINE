export const isPublicRoutes = ["/auth(.*)", "/Auth(.*)", "/"];
export const isProtectedRoutes = ["/dashboard(.*)"];

export const isBypassRoutes = [
    "/api/polar/webhook",
    "/api/inngest(.*)",
    "/api/auth(.*)",
    "/convex(.*)",
];
