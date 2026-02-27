//src/app/page.tsx
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { ArrowRight, Star, Ticket, Search, MoveRight } from "lucide-react";

const prisma = new PrismaClient();

async function getFields() {
  const fields = await prisma.field.findMany({
    orderBy: { name: "asc" },
  });
  return fields;
}

export default async function Home() {
  const fields = await getFields();

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero Section */}
      <div className="bg-zinc-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
            SPORT COMPLEX <span className="text-blue-500">THAKSIN</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            ศูนย์รวมกีฬาทันสมัย จองง่าย จ่ายสะดวก พร้อมให้บริการทุกวัน
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        
        {/* ✨ เปลี่ยนเป็นปุ่มกดเด้งไปหน้าค้นหา (Search Shortcut Button) */}
        <div className="max-w-md mx-auto -mt-8 mb-16 relative z-30">
          <Link href="/search" className="block group">
            <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white transition-transform duration-300 group-hover:scale-[1.02] group-active:scale-95">
              <div className="bg-zinc-900 rounded-[1.8rem] p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 pl-2">
                  <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
                    <Ticket size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">ค้นหาการจองของคุณ</h3>
                    <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">Check your booking</p>
                  </div>
                </div>
                
                <div className="bg-white/10 p-2.5 rounded-xl text-white group-hover:bg-blue-600 transition-colors">
                  <Search size={20} />
                </div>
              </div>
            </div>
          </Link>
          <p className="text-center mt-4 text-[11px] text-zinc-400 font-medium italic">
       
          </p>
        </div>

        {/* Field List Section */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 border-l-4 border-blue-600 pl-3 leading-none">
            สนามที่เปิดให้บริการ
          </h2>
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 bg-white px-4 py-2 rounded-full border border-zinc-100 shadow-sm">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            {fields.length} ARENAS
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {fields.map((field) => (
            <Link
              href={`/fields/${field.id}`}
              key={field.id}
              className="group bg-white rounded-[1.8rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 border border-zinc-100 transition-all duration-500 transform hover:-translate-y-1"
            >
              <div className="h-48 bg-zinc-200 relative overflow-hidden">
                <img
                  src={field.imageUrl || "https://jjrzhtsnledoueutwfae.supabase.co/storage/v1/object/public/field-images/thaksin.jpg"}
                  alt={field.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-zinc-900 flex items-center gap-1 shadow-sm border border-white">
                  <Star size={12} className="text-yellow-500 fill-yellow-500" /> 5.0
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold text-zinc-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {field.name}
                </h3>
                <p className="text-zinc-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">
                  {field.description}
                </p>

                <div className="flex items-center justify-between pt-5 border-t border-zinc-50">
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">ราคาเริ่มต้น</p>
                    <p className="text-xl font-black text-zinc-900">
                      ฿{field.memberPrice} <span className="text-xs font-medium text-zinc-400">/ ชม.</span>
                    </p>
                  </div>
                  <div className="bg-zinc-100 text-zinc-900 p-3 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}