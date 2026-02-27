"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Check, X, ExternalLink, Loader2, Search, 
  Calendar as CalendarIcon, Users, AlertCircle, LogOut
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false); // ✅ เช็ค auth ก่อน render
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // ✅ เช็ค localStorage ว่า login อยู่ไหม — ถ้าไม่มีให้ redirect ไป login
  useEffect(() => {
    const isAuth = localStorage.getItem("admin_auth");
    if (!isAuth) {
      router.replace("/admin/login");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      const sortedData = Array.isArray(data) ? data.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.id).getTime();
        const dateB = new Date(b.createdAt || b.id).getTime();
        return dateB - dateA;
      }) : [];
      setBookings(sortedData);
      setFilteredBookings(sortedData);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked) fetchBookings();
  }, [authChecked]);

  useEffect(() => {
    let result = [...bookings];
    if (filterStatus !== "ALL") {
      result = result.filter((b: any) => b.status === filterStatus);
    }
    if (searchTerm) {
      result = result.filter((b: any) =>
        (b.guestName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.guestPhone?.includes(searchTerm)) ||
        (b.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredBookings(result);
  }, [searchTerm, filterStatus, bookings]);

  const updateStatus = async (id: string, newStatus: string) => {
    const confirmMsg = newStatus === "PAID" ? "ยืนยันการรับชำระเงิน?" : "ปฏิเสธรายการจองนี้?";
    if (!confirm(confirmMsg)) return;
    try {
      await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchBookings();
    } catch {
      alert("ไม่สามารถอัปเดตสถานะได้");
    }
  };

  // ✅ ปุ่ม Logout — ลบ localStorage แล้วไปหน้า login
  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    router.push("/admin/login");
  };

  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const stats = {
    pending: safeBookings.filter((b: any) => b.status === "PENDING").length,
    today: safeBookings.filter((b: any) => b.date === new Date().toISOString().split('T')[0]).length,
    totalPaid: safeBookings.filter((b: any) => b.status === "PAID").length,
  };

  // ✅ ยังไม่เช็ค auth เสร็จ = ไม่แสดงอะไร (กันหน้ากระพริบ)
  if (!authChecked) return null;

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-zinc-500 font-medium">กำลังโหลดข้อมูลการจอง...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-zinc-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Admin Console</h1>
            <p className="text-zinc-500 font-medium">จัดการรายการจองและตรวจสอบการชำระเงิน</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">รอตรวจสอบ</p>
                <p className="text-xl font-black text-orange-500">{stats.pending}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">จองวันนี้</p>
                <p className="text-xl font-black text-blue-600">{stats.today}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">สำเร็จแล้ว</p>
                <p className="text-xl font-black text-green-600">{stats.totalPaid}</p>
              </div>
            </div>

            {/* ✅ ปุ่ม Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-zinc-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all text-sm font-bold shadow-sm"
            >
              <LogOut size={16} /> ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้จอง หรือเบอร์โทร..."
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {["ALL", "PENDING", "PAID", "REJECTED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === status
                    ? "bg-zinc-900 text-white shadow-md"
                    : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-zinc-200/50 border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900">
                  <th className="p-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">กำหนดการ</th>
                  <th className="p-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ข้อมูลติดต่อ</th>
                  <th className="p-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">สนาม/จำนวน</th>
                  <th className="p-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">หลักฐาน</th>
                  <th className="p-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">สถานะ</th>
                  <th className="p-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="bg-zinc-100 p-2 rounded-lg text-zinc-600 group-hover:bg-white transition-colors">
                          <CalendarIcon size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-800">{b.date}</p>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">{b.startTime} - {b.endTime}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="font-bold text-zinc-800 leading-tight">{b.user?.name || b.guestName}</p>
                      <p className="text-xs text-zinc-400">{b.user?.email || b.guestPhone}</p>
                    </td>
                    <td className="p-5 text-zinc-600">
                      <p className="text-sm font-bold text-zinc-700">{b.field?.name || "สนามทั่วไป"}</p>
                      <p className="text-[10px] flex items-center gap-1 text-zinc-400"><Users size={12} /> {b.playerCount} คน</p>
                    </td>
                    <td className="p-5">
                      {b.slipUrl ? (
                        <a
                          href={b.slipUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          <ExternalLink size={12} /> สลิป
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-zinc-300 text-[10px] font-bold uppercase italic">
                          <AlertCircle size={12} /> No Slip
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-sm border ${
                        b.status === 'PAID' ? 'bg-green-50 text-green-600 border-green-100' :
                        b.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-orange-50 text-orange-600 border-orange-100 animate-pulse'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        {b.status === "PENDING" && (
                          <button
                            onClick={() => updateStatus(b.id, "PAID")}
                            className="p-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 hover:scale-110 active:scale-95 transition-all shadow-md shadow-green-200"
                            title="ยืนยันการชำระเงิน"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(b.id, "REJECTED")}
                          className="p-2.5 bg-white text-zinc-400 border border-zinc-200 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 hover:scale-110 active:scale-95 transition-all"
                          title="ปฏิเสธรายการ"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="p-20 text-center bg-white">
              <div className="bg-zinc-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-zinc-300" />
              </div>
              <p className="text-zinc-500 font-bold">ไม่พบข้อมูลที่ตรงกับการค้นหา</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
