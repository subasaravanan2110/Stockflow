import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  // Optimistic redirect only. The DAL performs authoritative database checks.
  const hasSession = Boolean(
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token"),
  );
  if (!hasSession && request.nextUrl.pathname.startsWith("/dashboard")) {
    const login = new URL("/login", request.nextUrl);
    login.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
