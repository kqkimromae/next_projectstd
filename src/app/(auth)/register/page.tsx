//src/app/(auth)/register/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (res.ok) {
      alert("ยินดีด้วย! สมัครสมาชิกสำเร็จแล้ว");
      // หลังจากสมัครเสร็จ ให้เด้งไปหน้า Login
      window.location.href = "/login";
    } else {
      alert(data.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-sm border border-zinc-200">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-zinc-900">สร้างบัญชีใหม่</h1>
          <p className="mt-2 text-zinc-500">
            เพื่อเริ่มจองสนามใน Sport Complex
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              ชื่อ-นามสกุล
            </label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-zinc-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="สมชาย สายลุย"
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              required
              className="w-full rounded-xl border border-zinc-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="name@example.com"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              รหัสผ่าน
            </label>
            <input
              type="password"
              required
              className="w-full rounded-xl border border-zinc-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-zinc-900 py-4 font-bold text-white hover:bg-zinc-700 transition-all"
          >
            สมัครสมาชิก
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-600">
          มีบัญชีอยู่แล้ว?{" "}
          <Link
            href="/login"
            className="font-bold text-blue-600 hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
