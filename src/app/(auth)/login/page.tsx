//src/app/(auth)/login/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react"; // เพิ่ม
import { signIn } from "next-auth/react"; // เพิ่ม
import { useRouter } from "next/navigation"; // เพิ่ม

export default function LoginPage() {
  const [email, setEmail] = useState(""); // เพิ่ม
  const [password, setPassword] = useState(""); // เพิ่ม
  const [loading, setLoading] = useState(false); // เพิ่ม
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // เรียกใช้ NextAuth ในการตรวจสอบรหัสผ่าน
    const res = await signIn("credentials", { 
  email, 
  password, 
  callbackUrl: "/fields" // บังคับให้ไปหน้าหลัก
});

    if (res?.error) {
      alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง!");
      setLoading(false);
    } else {
      router.push("/fields"); // เข้าได้แล้วให้ไปหน้ารายการสนาม
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-sm border border-zinc-200">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-zinc-900">
            ยินดีต้อนรับกลับมา
          </h1>
          <p className="mt-2 text-zinc-500">
            เข้าสู่ระบบเพื่อจัดการการจองของคุณ
          </p>
        </div>

        {/* ใส่ onSubmit ให้ฟอร์ม */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)} // เก็บค่าอีเมล
              className="w-full rounded-xl border border-zinc-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              รหัสผ่าน
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)} // เก็บค่ารหัสผ่าน
              className="w-full rounded-xl border border-zinc-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-zinc-900 py-4 font-bold text-white hover:bg-zinc-700 transition-all disabled:bg-zinc-400"
          >
            {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-600">
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/register"
            className="font-bold text-blue-600 hover:underline"
          >
            สมัครสมาชิกฟรี
          </Link>
        </p>
      </div>
    </div>
  );
}
