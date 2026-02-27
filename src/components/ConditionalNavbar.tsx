"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // ✅ ซ่อน Navbar ถ้าเป็นหน้า /admin หรือ /admin/login
  if (pathname.startsWith("/admin")) return null;

  return <Navbar />;
}
