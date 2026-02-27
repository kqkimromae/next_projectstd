"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";

// ✅ ฝังรหัสผ่านไว้ที่นี่เลย (แก้ตามที่ต้องการ)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "sports1234";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // เช็ค username + password ตรงกับที่ฝังไว้ไหม
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // บันทึก session ลง localStorage
      localStorage.setItem("admin_auth", "true");
      router.push("/admin");
    } else {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        
        {/* Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl mb-4">
            <Lock className="text-blue-500" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white">Admin Access</h1>
          <p className="text-zinc-500 text-sm mt-1">Sport Complex Thaksin</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-5">
          
          {/* Error */}
          {error && (
            <div className="bg-red-950 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
              ชื่อผู้ใช้
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="admin"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 pr-12 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
