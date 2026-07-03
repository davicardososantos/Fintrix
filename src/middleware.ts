import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Usa só a config base (sem Prisma) — seguro para o Edge runtime do middleware.
const { auth } = NextAuth(authConfig);

// Protege a área logada; manda quem não está autenticado para /login.
export default auth((req) => {
  const isAuth = !!req.auth;
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth");

  if (!isAuth && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (isAuth && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  // Roda em tudo, exceto assets estáticos, imagens e artefatos do PWA (sw.js, manifest, ícones).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|logo.png).*)"],
};
