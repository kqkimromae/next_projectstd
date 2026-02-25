"use client";

import { useState } from "react";
import { Search, MapPin, Calendar, Clock, ArrowRight, Loader2, Ticket } from "lucide-react";
import Link from "next/link";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/search?q=${query}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Search className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-zinc-900">ค้นหาการจองของคุณ</h1>
          <p className="text-zinc-500 mt-2">กรอกเบอร์โทรศัพท์ หรือรหัสการจองเพื่อดูตั๋วเข้าสนาม</p>
        </div>

        {/* ช่องค้นหา */}
        <form onSubmit={handleSearch} className="relative mb-12">
          <input
            type="text"
            placeholder="ใส่เบอร์โทร หรือ รหัสการจอง..."
            className="w-full p-6 pr-20 bg-white rounded-[2rem] border-none shadow-xl shadow-zinc-200/50 outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit"
            className="absolute right-3 top-3 bottom-3 px-6 bg-blue-600 text-white rounded-[1.5rem] font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "ค้นหา"}
          </button>
        </form>

        {/* แสดงผลลัพธ์ */}
        <div className="space-y-4">
          {results.length > 0 ? (
            results.map((booking: any) => (
              <Link 
                key={booking.id} 
                href={`/tickets/${booking.id}`}
                className="block bg-white p-6 rounded-[2rem] border border-zinc-100 hover:border-blue-300 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase">
                      <Ticket size={16} />
                      <span>{booking.status}</span>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">{booking.field.name}</h3>
                    <div className="flex flex-wrap gap-4 text-zinc-500 text-sm">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {booking.date}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {booking.startTime}:00</span>
                    </div>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-2xl group-hover:bg-blue-50 transition-colors">
                    <ArrowRight className="text-zinc-400 group-hover:text-blue-600" />
                  </div>
                </div>
              </Link>
            ))
          ) : query && !loading ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-zinc-200 text-zinc-400">
              ไม่พบข้อมูลการจอง ลองเช็คเบอร์โทรอีกครั้งนะครับ
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
