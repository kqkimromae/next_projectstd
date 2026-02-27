"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Ticket, ShieldCheck, Home, Search } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const adminAuth = localStorage.getItem("admin_auth");
    setIsAdminLoggedIn(!!adminAuth);
  }, []);

  // ✅ ซ่อน Navbar ทั้งหมดถ้าเป็นหน้า /admin
  if (pathname.startsWith("/admin")) return null;

  const handleAdminLogout = () => {
    localStorage.removeItem("admin_auth");
    setIsAdminLoggedIn(false);
    router.push("/admin/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* ✅ โลโก้ + เมนูซ้าย */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-zinc-900">
                Football Booking
              </span>
            </Link>

            {/* Home + Search */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
              >
                <Home size={16} /> Home
              </Link>
              <Link
                href="/search"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
              >
                <Search size={16} /> Search
              </Link>
            </div>
          </div>

          {/* เมนูขวา */}
          <div className="flex items-center gap-4">

            {/* Case 1: Admin login ด้วย localStorage */}
            {isAdminLoggedIn && !session ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/admin"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                  <ShieldCheck size={18} /> จัดการระบบ
                </Link>
                <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-sm">
                    A
                  </div>
                  <div className="hidden md:block text-sm">
                    <p className="font-bold text-gray-900">Admin</p>
                    <p className="text-xs text-red-500 font-medium">ผู้ดูแลระบบ</p>
                  </div>
                </div>
                <button
                  onClick={handleAdminLogout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut size={20} />
                </button>
              </div>

            ) : session ? (
              // Case 2: Member login ด้วย NextAuth
              <div className="flex items-center gap-4">
                <Link
                  href="/tickets"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                  <Ticket size={18} /> ตั๋วของฉัน
                </Link>
                <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      {session.user?.name?.[0] || "U"}
                    </div>
                  )}
                  <div className="hidden md:block text-sm">
                    <p className="font-bold text-gray-900">{session.user?.name}</p>
                    <p className="text-xs text-green-600 font-medium">สมาชิก (Member)</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut size={20} />
                </button>
              </div>

            ) : (
              // Case 3: ยังไม่ได้ login
              <button
                onClick={() => signIn()}
                className="bg-zinc-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-zinc-800 transition-all shadow-md active:scale-95"
              >
                เข้าสู่ระบบ / สมัครสมาชิก
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
