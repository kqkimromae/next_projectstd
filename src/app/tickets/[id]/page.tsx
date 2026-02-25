"use client";

import { useEffect, useState } from "react";
import { Loader2, Calendar, Clock, MapPin, CheckCircle2, Clock3, XCircle, AlertTriangle, Printer, RefreshCw, ChevronLeft } from "lucide-react";
import QRCode from "react-qr-code";
import Link from "next/link";

export default function TicketPage({ params }: { params: { id: string } }) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bookings/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.message) {
          setBooking(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;
  
  // ถ้าไม่มี booking หรือมี error message จาก API
  if (!booking || booking.message) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4 text-center">
      <AlertTriangle className="text-zinc-300 mb-4" size={60} />
      <h2 className="text-xl font-bold text-zinc-800">ไม่พบข้อมูลการจอง</h2>
      <p className="text-zinc-500 mb-6">รหัสการจองอาจไม่ถูกต้อง หรือถูกลบออกจากระบบแล้ว</p>
      <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold">กลับหน้าหลัก</Link>
    </div>
  );

  // --- Logic การเช็ควันหมดอายุ ---
  const today = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
  today.setHours(0, 0, 0, 0);
  
  const bookingDate = new Date(booking.date);
  bookingDate.setHours(0, 0, 0, 0);

  const isExpired = bookingDate < today;
  const isPaid = booking.status === "PAID";
  const isRejected = booking.status === "REJECTED";

  return (
    <div className={`min-h-screen py-12 px-4 transition-colors duration-500 ${isExpired ? 'bg-zinc-200' : 'bg-zinc-100'}`}>
      <div className="max-w-md mx-auto shadow-2xl shadow-zinc-300">
        
        {/* แถบแจ้งเตือนกรณีหมดอายุ */}
        {isExpired && (
          <div className="bg-red-600 text-white text-center py-2 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-t-3xl">
            <AlertTriangle size={14} /> This Ticket has Expired
          </div>
        )}

        {/* หัวตั๋ว */}
        <div className={`p-8 text-white text-center transition-colors ${
          isExpired ? 'bg-zinc-500' : 
          isRejected ? 'bg-red-600' :
          isPaid ? 'bg-green-600' : 'bg-blue-600'
        } ${!isExpired && 'rounded-t-3xl'}`}>
          <h1 className="text-3xl font-black tracking-tighter italic uppercase">E-TICKET</h1>
          <p className="opacity-70 text-xs mt-1 font-mono uppercase">ID: {booking.id?.slice(-12).toUpperCase()}</p>
        </div>

        {/* ตัวตั๋ว */}
        <div className="bg-white p-8 relative overflow-hidden">
          
          {isExpired && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07] rotate-[-35deg]">
              <h2 className="text-8xl font-black uppercase border-8 border-black p-4">Expired</h2>
            </div>
          )}

          {/* Badge สถานะ */}
          <div className="flex justify-center mb-8">
            {isExpired ? (
              <div className="flex items-center gap-2 bg-zinc-100 text-zinc-500 px-5 py-2 rounded-full border border-zinc-200 text-xs font-black uppercase">
                <XCircle size={16}/> สิ้นสุดระยะเวลาใช้งาน
              </div>
            ) : isRejected ? (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-5 py-2 rounded-full border border-red-200 text-xs font-black uppercase tracking-wide">
                <XCircle size={16}/> การจองถูกปฏิเสธ
              </div>
            ) : isPaid ? (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-5 py-2 rounded-full border border-green-200 text-xs font-black uppercase tracking-wide">
                <CheckCircle2 size={16}/> ชำระเงินเรียบร้อย
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-5 py-2 rounded-full border border-blue-200 text-xs font-black uppercase tracking-wide animate-pulse">
                <Clock3 size={16}/> รอตรวจสอบยอดเงิน
              </div>
            )}
          </div>

          {/* รายละเอียด */}
          <div className="space-y-6 mb-8 relative z-10">
            <div className="flex items-start gap-4">
              <div className="bg-zinc-50 p-2.5 rounded-xl text-zinc-400 border border-zinc-100"><MapPin size={22}/></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">สถานที่ใช้บริการ</p>
                <p className="font-black text-zinc-800 text-lg leading-tight uppercase">
                  {booking.field?.name || "SPORTS COMPEX THAKSIN"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-zinc-50 p-2 rounded-lg text-zinc-400 border border-zinc-100"><Calendar size={18}/></div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-widest">วันที่</p>
                  <p className="font-bold text-zinc-800 text-sm">{booking.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-zinc-50 p-2 rounded-lg text-zinc-400 border border-zinc-100"><Clock size={18}/></div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-widest">เวลา</p>
                  <p className="font-bold text-zinc-800 text-sm">{booking.startTime} - {booking.endTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className={`p-6 border-2 border-dashed rounded-[2rem] flex flex-col items-center transition-all ${
            isExpired ? 'border-zinc-200 bg-zinc-50' : isPaid ? 'border-green-200 bg-green-50/30' : 'border-zinc-100 bg-zinc-50'
          }`}>
            {isPaid && !isExpired ? (
              <>
                <div className="bg-white p-4 rounded-3xl shadow-lg shadow-green-100 ring-4 ring-white">
                  <QRCode value={booking.accessCode || booking.id} size={160} />
                </div>
                <p className="mt-5 text-[10px] text-zinc-400 font-mono font-bold tracking-[0.3em] bg-white px-3 py-1 rounded-full border border-zinc-100 shadow-sm uppercase">
                  {(booking.accessCode || booking.id || "").slice(0, 18)}...
                </p>
              </>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center px-4">
                <div className="bg-zinc-100 p-4 rounded-full mb-3">
                  {isExpired ? <AlertTriangle className="text-zinc-400" size={32} /> : <Clock3 className="text-zinc-400" size={32} />}
                </div>
                <p className="text-zinc-500 font-bold text-sm leading-relaxed">
                  {isExpired ? "ตั๋วหมดอายุการใช้งานแล้ว" : "QR Code จะแสดงผล\nหลังจากยืนยันชำระเงิน"}
                </p>
              </div>
            )}
          </div>

          {/* ปุ่มแก้ไขการจอง (โชว์เฉพาะเมื่อยังไม่จ่ายและไม่หมดอายุ) */}
          {!isPaid && !isExpired && (
            <div className="mt-6 border-t pt-6">
              <button 
                onClick={() => window.location.href = `/fields/${booking.fieldId || 'thaksin'}?edit=${booking.id}`}
                className="w-full py-4 bg-orange-50 text-orange-600 border border-orange-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-100 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <RefreshCw size={16} /> แก้ไขข้อมูลการจอง
              </button>
            </div>
          )}

          <div className="absolute -left-4 bottom-24 w-8 h-8 bg-zinc-100 rounded-full border-r border-zinc-200 shadow-inner"></div>
          <div className="absolute -right-4 bottom-24 w-8 h-8 bg-zinc-100 rounded-full border-l border-zinc-200 shadow-inner"></div>
        </div>

        {/* ท้ายตั๋ว */}
        <div className={`p-6 rounded-b-3xl text-center flex flex-col gap-3 transition-colors ${isExpired ? 'bg-zinc-800' : 'bg-zinc-900'}`}>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              {isExpired ? "รายการจองนี้ถูกบันทึกเป็นประวัติแล้ว" : "กรุณาเตรียมภาพหน้าจอนี้เพื่อสแกนเข้าสนาม"}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => window.print()} 
                className={`flex items-center gap-2 text-white text-xs font-black uppercase px-6 py-2 rounded-full border border-zinc-700 hover:bg-zinc-800 transition-all ${isExpired && 'opacity-50'}`}
                disabled={isExpired}
              >
                <Printer size={14}/> Save as PDF
              </button>
            </div>
        </div>
      </div>
      
      <div className="text-center mt-8">
        <Link href="/" className="flex items-center justify-center gap-1 text-zinc-400 hover:text-zinc-600 text-sm font-bold transition-colors">
          <ChevronLeft size={16} /> กลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}