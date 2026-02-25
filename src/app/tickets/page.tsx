"use client";

import { useEffect, useState } from "react";
import { Ticket, Calendar, Clock, ChevronRight, Loader2, Edit3 } from "lucide-react"; // เพิ่ม Edit3
import Link from "next/link";

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/tickets")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTickets(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black text-zinc-900 mb-6">ตั๋วของฉัน</h1>
        
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl text-center border border-zinc-200">
              <p className="text-zinc-400">ยังไม่มีประวัติการจอง</p>
            </div>
          ) : (
            tickets.map((t: any) => (
              <div key={t.id} className="relative group">
                {/* 1. ส่วนแสดงข้อมูลตั๋ว (คลิกเพื่อดูรายละเอียดตั๋วปกติ) */}
                <Link href={`/tickets/${t.id}`} className="block">
                  <div className="bg-white p-5 rounded-2xl border border-zinc-200 group-hover:border-blue-200 transition-all shadow-sm flex justify-between items-center pr-24">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${t.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        <Ticket size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900">{t.field.name}</h3>
                        <div className="flex gap-3 text-xs text-zinc-500 mt-1">
                          <span className="flex items-center gap-1"><Calendar size={14}/> {t.date}</span>
                          <span className="flex items-center gap-1"><Clock size={14}/> {t.startTime}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${t.status === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        {t.status === 'PAID' ? 'จ่ายแล้ว' : 'รอตรวจ'}
                      </span>
                      <ChevronRight size={18} className="text-zinc-300" />
                    </div>
                  </div>
                </Link>

                {/* 2. ปุ่มแก้ไขการจอง (วางทับด้านขวาเพื่อให้กดแยกได้) */}
                <Link 
                  href={`/fields/${t.fieldId}?edit=${t.id}`}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-zinc-900 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg flex items-center gap-2 text-xs font-bold"
                >
                  <Edit3 size={14} />
                  แก้ข้อมูล
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}