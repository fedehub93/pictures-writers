import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (isAdminRoute(req)) auth().protect();
});

export const config = {
  matcher: [
    "/admin((?!/static).*)", // Solo per le rotte admin
    "/api/(.*)", // Proteggi le API se necessario
  ],
};
