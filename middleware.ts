// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // ต้องเช็คว่า cookie มีค่าไหมก่อนดึง value
  const userId = request.cookies.get("userId")?.value;
  const userRole = request.cookies.get("userRole")?.value;
  const path = request.nextUrl.pathname;

  // 1. ตรวจสอบ Authentication
  if (!userId && (path.startsWith("/dashboard") || path.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. ตรวจสอบ RBAC
  if (path.startsWith("/admin") && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login"],
};
