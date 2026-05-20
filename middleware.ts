import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

// export default convexAuthNextjsMiddleware((request) => {
//     return;
// });

export default function middleware() { };

export const config = {
    // The following matcher runs middleware on all routes
    // except static assets.
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
