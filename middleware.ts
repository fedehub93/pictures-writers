import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/admin((?!/static).*)", // Solo per le rotte admin
    "/api/(.*)", // Proteggi le API se necessario
  ],
};
