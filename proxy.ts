import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirections simples (sans authentification ici)
  // L'authentification sera gérée dans les layouts/route handlers

  // Si l'utilisateur essaie d'accéder à /login ou /signup et est déjà connecté,
  // on redirige vers /app (mais on ne peut pas vérifier l'auth ici)
  // Cette logique sera déplacée dans les layouts

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup"],
};
