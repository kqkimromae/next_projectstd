"use client";

import { useState, useEffect, useMemo } from "react"; // เพิ่ม useMemo สำหรับคำนวณราคา
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  Upload,
  Loader2,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  User,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export default function FieldBookingPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit"); 

  const [field, setField] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookedSlots, setBookedSlots] = useState<{ startTime: string; totalPlayers: number }[]>([]);

  const [date, setDate] = useState("");
  const [bookingType, setBookingType] = useState("SOLO");
  const [playerCount, setPlayerCount] = useState(1);
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("18:00");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [existingPaidAmount, setExistingPaidAmount] = useState(0); 
  const [isUploading, setIsUploading] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const timeSlots = Array.from({ length: 14 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);
useEffect(() => {
  fetch(`/api/fields/${params.id}`)
    .then((res) => {
      if (!res.ok) throw new Error("ดึงข้อมูลไม่สำเร็จ");
      return res.json();
    })
    .then((data) => {
      // ✅ ดึงค่าจาก DB (ราคา, ความจุ) แต่บังคับชื่อและรูปภาพเดิม
      setField({
        ...data, // ดึงค่า price, memberPrice, และ capacity จาก Database มาทั้งหมด
        name: "SPORTS COMPEX THAKSIN", 
        description: "สนามมาตรฐานคุณภาพเยี่ยม พร้อมให้บริการรองรับทั้งแบบเดี่ยวและทีม",
        imageUrl: "https://jjrzhtsnledoueutwfae.supabase.co/storage/v1/object/public/field-images/thaksin.jpg",
      });
      setLoading(false);
    })
    .catch((err) => {
      console.error("Error:", err);
      // กรณี Error: แสดงข้อมูลสำรอง (ใส่ค่าเริ่มต้นไว้กันระบบคำนวณพัง)
      setField({
        id: params.id,
        name: "SPORTS COMPEX THAKSIN",
        description: "สนามมาตรฐานคุณภาพเยี่ยม พร้อมให้บริการรองรับทั้งแบบเดี่ยวและทีม",
        imageUrl: "https://jjrzhtsnledoueutwfae.supabase.co/storage/v1/object/public/field-images/thaksin.jpg",
        price: 0, 
        memberPrice: 0,
        capacity: 12, // ค่าสำรองกรณีดึง DB ไม่ได้
      });
      setLoading(false);
    });
}, [params.id]);

  useEffect(() => {
    if (date) {
      fetch(`/api/fields/${params.id}/booked-slots?date=${date}`)
        .then((res) => res.json())
        .then((data) => setBookedSlots(data))
        .catch((err) => console.error("Error fetching slots:", err));
    }
  }, [date, params.id]);

  // ✨ ระบบเช็ควันเวลาจองเดิม (กันแก้ไขของหมดอายุ)
  useEffect(() => {
    if (editId) {
      fetch(`/api/bookings/${editId}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.message) {
            const now = new Date();
            const bookingDateTime = new Date(`${data.date}T${data.startTime}`);
            
            if (bookingDateTime < now) {
              alert("❌ ไม่สามารถแก้ไขได้เนื่องจากเวลาการจองผ่านไปแล้ว");
              router.push("/");
              return;
            }

            setDate(data.date);
            setBookingType(data.bookingType);
            setPlayerCount(data.playerCount);
            setStartTime(data.startTime);
            setEndTime(data.endTime);
            setGuestName(data.guestName || "");
            setGuestPhone(data.guestPhone || "");
            setExistingPaidAmount(data.totalPrice || data.amountPaid || 0);
          }
        })
        .catch(err => console.error("Error loading original booking:", err));
    }
  }, [editId, router]);

  // ✨ คำนวณราคาส่วนต่างด้วย useMemo (กันราคามั่ว)
  const amountToPay = useMemo(() => {
    if (!field) return 0;
    const start = parseInt(startTime.split(":")[0]);
    const end = parseInt(endTime.split(":")[0]);
    const duration = end - start;
    
    if (duration <= 0) return 0;

    const pricePerPerson = session ? field.memberPrice : field.price;
    const discount = bookingType === "TEAM" && playerCount >= 6 ? 0.9 : 1;
    const newFullPrice = duration * pricePerPerson * playerCount * discount;

    if (!editId) return newFullPrice;
    return Math.max(0, newFullPrice - existingPaidAmount);
  }, [startTime, endTime, playerCount, bookingType, field, session, editId, existingPaidAmount]);

  const maxCapacity = field?.capacity || 12;
  const currentReserved = bookedSlots.find(s => s.startTime === startTime)?.totalPlayers || 0;

  const isSlotFull = (time: string) => {
    const slot = bookedSlots.find((s) => s.startTime === time);
    return slot ? slot.totalPlayers >= maxCapacity : false;
  };

  const handleBooking = async () => {
    if (!date) return alert("กรุณาเลือกวันที่");
    if (currentReserved + playerCount > maxCapacity) return alert("ขออภัย สนามเต็มแล้วในเวลานี้");
    if (amountToPay > 0 && !slipFile) return alert("กรุณาแนบสลิปโอนเงินส่วนต่าง");

    setIsUploading(true);
    try {
      let publicUrl = null;
      if (slipFile) {
        const fileName = `${Date.now()}-${slipFile.name}`;
        await supabase.storage.from("field-images").upload(fileName, slipFile);
        const { data } = supabase.storage.from("field-images").getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      const url = editId ? `/api/bookings/${editId}` : "/api/bookings";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: params.id,
          userId: session?.user ? (session as any).user.id : null,
          date, startTime, endTime, playerCount, bookingType,
          guestName: session ? null : guestName,
          guestPhone: session ? null : guestPhone,
          slipUrl: publicUrl,
          totalPrice: amountToPay + existingPaidAmount, 
          status: "PENDING"
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "ดำเนินการไม่สำเร็จ");

      // ✨ ส่วนแก้ไขที่สำคัญ: ดัก ID ทุกช่องทางที่ API อาจส่งกลับมา
      const bookingId = editId || result.id || result?.data?.id || result?.booking?.id;
      
      if (bookingId) {
        router.push(`/tickets/${bookingId}`);
        router.refresh();
      } else {
        // ถ้าเข้าเงื่อนไขนี้ ข้อมูลเข้า Database แล้ว แต่เราแค่หา ID ไปเปิดหน้าตั๋วไม่เจอ
        console.error("Debug Response:", result);
        alert("บันทึกสำเร็จ! (แต่หาหมายเลข ID ไม่เจอ กรุณาเช็คในประวัติการจอง)");
      }

    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-6 font-medium transition-colors">
          <ArrowLeft size={20} /> {editId ? "ยกเลิกการแก้ไข" : "กลับไปหน้าเลือกสนาม"}
        </Link>

        {editId && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-3 text-orange-700">
            <RefreshCw size={20} className="animate-spin-slow" />
            <div>
              <p className="font-bold text-sm">โหมดแก้ไขการจอง</p>
              <p className="text-xs opacity-80">คุณสามารถเปลี่ยนวัน เวลา หรือจำนวนคนได้ ระบบจะคำนวณส่วนต่างราคาให้โดยอัตโนมัติ</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-zinc-100 overflow-hidden">
              <div className="h-64 md:h-80 bg-zinc-900 relative">
                <img src={field.imageUrl} className="w-full h-full object-cover opacity-80" alt="Field" />
                <div className="absolute bottom-0 left-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent w-full">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{field.name}</h1>
                  <div className="flex items-center gap-4 text-zinc-300 text-sm">
                    <span className="flex items-center gap-1.5"><Clock size={16} /> 08:00 - 22:00</span>
                    <span className="flex items-center gap-1.5"><Users size={16} /> รองรับสูงสุด {maxCapacity} คน/รอบ</span>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="mb-10">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                      <Clock className="text-blue-600" size={20} /> 
                      สถานะที่ว่างรายชั่วโมง {date && <span className="text-blue-600 ml-1">({date})</span>}
                    </h3>
                  </div>

                  {!date ? (
                    <div className="py-12 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[1.5rem] text-center text-zinc-400 font-medium">
                      กรุณาเลือกวันที่ด้านข้าง เพื่อตรวจสอบที่ว่าง
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {timeSlots.map((time) => {
                        const slot = bookedSlots.find((s) => s.startTime === time);
                        const reserved = slot?.totalPlayers || 0;
                        const isFull = reserved >= maxCapacity;
                        const isSelected = startTime === time;

                        return (
                          <button
                            key={time}
                            disabled={isFull}
                            onClick={() => {
                              setStartTime(time);
                              const nextHour = (parseInt(time.split(":")[0]) + 1).toString().padStart(2, "0") + ":00";
                              setEndTime(nextHour);
                            }}
                            className={`p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${
                              isFull 
                                ? "bg-zinc-100 border-zinc-100 cursor-not-allowed opacity-60" 
                                : isSelected
                                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                                  : "border-zinc-100 hover:border-blue-200 bg-white shadow-sm hover:shadow-md"
                            }`}
                          >
                            <span className={`text-xs font-bold block mb-1 ${isSelected ? "text-blue-600" : "text-zinc-500"}`}>
                              {time}
                            </span>
                            <div className="flex justify-between items-end">
                              <span className={`text-lg font-black ${isFull ? "text-zinc-400" : "text-zinc-900"}`}>
                                {reserved}/{maxCapacity}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isFull ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                                {isFull ? "เต็ม" : "ว่าง"}
                              </span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-100">
                              <div 
                                className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-blue-500'}`} 
                                style={{ width: `${(reserved / maxCapacity) * 100}%` }} 
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <p className="text-zinc-600 leading-relaxed mb-8 border-t pt-8 italic">{field.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-5 rounded-2xl border ${!session ? "bg-blue-50 border-blue-200" : "bg-white border-zinc-100 opacity-60"}`}>
                    <p className="text-xs font-bold text-blue-600 uppercase mb-1 text-center">ราคาบุคคลทั่วไป</p>
                    <p className="text-2xl font-black text-zinc-900 text-center">฿{field.price}<span className="text-sm font-normal text-zinc-400 ml-1">/ชม.</span></p>
                  </div>
                  <div className={`p-5 rounded-2xl border ${session ? "bg-green-50 border-green-200" : "bg-white border-zinc-100 opacity-60"}`}>
                    <p className="text-xs font-bold text-green-600 uppercase mb-1 text-center">ราคาสมาชิก</p>
                    <p className="text-2xl font-black text-zinc-900 text-center">฿{field.memberPrice}<span className="text-sm font-normal text-zinc-400 ml-1">/ชม.</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-xl shadow-zinc-200/50 sticky top-8">
              <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <Calendar className="text-blue-600" size={22} /> 
                {editId ? "ระบุข้อมูลใหม่" : "จองสนาม"}
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">1. เลือกวันที่</label>
                  <input 
                    type="date" 
                    min={today} 
                    value={date}
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" 
                    onChange={(e) => setDate(e.target.value)} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {setBookingType("SOLO"); setPlayerCount(1)}} 
                    className={`py-3.5 rounded-xl border-2 font-bold flex flex-col items-center gap-1 transition-all ${bookingType === "SOLO" ? "border-blue-600 bg-blue-50 text-blue-600" : "border-zinc-100 text-zinc-400"}`}
                  >
                    <User size={18} /> จองเดี่ยว
                  </button>
                  <button 
                    onClick={() => {setBookingType("TEAM"); setPlayerCount(6)}} 
                    className={`py-3.5 rounded-xl border-2 font-bold flex flex-col items-center gap-1 transition-all ${bookingType === "TEAM" ? "border-blue-600 bg-blue-50 text-blue-600" : "border-zinc-100 text-zinc-400"}`}
                  >
                    <Users size={18} /> จองทีม
                  </button>
                </div>

                {bookingType === "TEAM" && (
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">ระบุจำนวนคนในทีม</label>
                    <input 
                      type="number" 
                      min="1" 
                      max={maxCapacity - currentReserved} 
                      value={playerCount} 
                      onChange={(e) => setPlayerCount(Number(e.target.value))} 
                      className="w-full p-2.5 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">เวลาเริ่ม</label>
                    <select className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-bold" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                      {timeSlots.map(t => <option key={t} value={t} disabled={isSlotFull(t)}>{t} {isSlotFull(t) ? "❌" : ""}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">สิ้นสุด</label>
                    <select className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-bold" value={endTime} onChange={(e) => setEndTime(e.target.value)}>
                      {timeSlots.map(t => parseInt(t) > parseInt(startTime) && <option key={t} value={t}>{t}</option>)}
                      <option value="22:00">22:00</option>
                    </select>
                  </div>
                </div>

                {!session && (
                  <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">ข้อมูลติดต่อ</p>
                    <input type="text" value={guestName} placeholder="ชื่อผู้จอง" className="w-full p-3 bg-white rounded-lg border border-zinc-200 text-sm outline-none" onChange={(e) => setGuestName(e.target.value)} />
                    <input type="tel" value={guestPhone} placeholder="เบอร์โทรศัพท์" className="w-full p-3 bg-white rounded-lg border border-zinc-200 text-sm outline-none" onChange={(e) => setGuestPhone(e.target.value)} />
                  </div>
                )}

                <div className="bg-zinc-900 text-white p-6 rounded-[1.5rem] text-center shadow-2xl">
                  {editId && existingPaidAmount > 0 && (
                    <div className="mb-4 border-b border-zinc-800 pb-2">
                       <p className="text-green-400 text-[10px] font-bold uppercase">เครดิตเดิม: ฿{existingPaidAmount}</p>
                    </div>
                  )}

                  <p className="text-zinc-400 text-xs mb-1 uppercase tracking-wider">
                    {amountToPay === 0 && editId ? "ใช้เครดิตเดิมได้เลย" : `ยอดชำระเพิ่ม (${playerCount} คน)`}
                  </p>
                  <p className="text-4xl font-black mb-6">฿{amountToPay}</p>

                  {amountToPay > 0 && (
                    <div className="mb-6 p-4 bg-white rounded-2xl text-zinc-900 animate-in fade-in zoom-in duration-300">
                      <img src={`https://promptpay.io/0919323040/${amountToPay}`} alt="QR" className="w-32 h-32 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">อับดุลฮากีม รอแม</p>
                      <p className="text-xs font-bold">สแกนจ่ายเพียงส่วนต่าง</p>
                    </div>
                  )}

                  <label className={`mb-4 block w-full cursor-pointer bg-zinc-800 border border-dashed rounded-xl p-3 transition-colors ${slipFile ? 'border-green-500' : 'border-zinc-600'}`}>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} />
                    <div className="flex items-center justify-center gap-2 text-sm text-zinc-300">
                      <Upload size={16} /> {slipFile ? "สลิปพร้อม ✅" : amountToPay > 0 ? "แนบสลิปส่วนต่าง" : "แนบสลิป (ถ้ามี)"}
                    </div>
                  </label>

                  <button 
                    onClick={handleBooking} 
                    disabled={isUploading || isSlotFull(startTime) || !date} 
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                  >
                    {isUploading ? <Loader2 className="animate-spin" size={20} /> : editId ? "ยืนยันการแก้ไข" : "ยืนยันการจองสนาม"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}