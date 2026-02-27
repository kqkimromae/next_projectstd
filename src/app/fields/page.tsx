//src/app/fields/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation"; // เพิ่ม useSearchParams
import { createClient } from "@supabase/supabase-js";
import {
  Upload, Loader2, ArrowLeft, Calendar, Clock, Users, User, AlertCircle, RefreshCw
} from "lucide-react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export default function FieldBookingPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit"); // ดึง ID การจองที่ต้องการแก้ไข

  const [field, setField] = useState<any>(null);
  const [oldBooking, setOldBooking] = useState<any>(null); // เก็บข้อมูลตั๋วใบเดิม
  const [loading, setLoading] = useState(true);
  const [bookedSlots, setBookedSlots] = useState<{ startTime: string; totalPlayers: number }[]>([]);

  const [date, setDate] = useState("");
  const [bookingType, setBookingType] = useState("SOLO");
  const [playerCount, setPlayerCount] = useState(1);
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("18:00");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const timeSlots = Array.from({ length: 14 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);
  const maxCapacity = field?.capacity || 12;
  const currentReserved = bookedSlots.find(s => s.startTime === startTime)?.totalPlayers || 0;

  useEffect(() => {
    const fetchData = async () => {
      // 1. ดึงข้อมูลสนาม
      const fieldData = {
        id: params.id,
        name: "SPORTS COMPEX THAKSIN",
        description: "สนามมาตรฐานคุณภาพเยี่ยม พร้อมให้บริการรองรับทั้งแบบเดี่ยวและทีม มีสิ่งอำนวยความสะดวกครบครัน",
        price: 60,
        memberPrice: 50,
        capacity: 12,
        imageUrl: "https://jjrzhtsnledoueutwfae.supabase.co/storage/v1/object/public/field-images/thaksin.jpg",
      };
      setField(fieldData);

      // 2. ถ้ามี editId ให้ดึงข้อมูลตั๋วเดิมมาเช็ค
      if (editId) {
        try {
          const res = await fetch(`/api/bookings/${editId}`);
          const data = await res.json();
          
          if (data) {
            // 🚩 เช็คว่าตั๋วหมดอายุหรือยัง (ถ้าเวลาเตะผ่านมาแล้ว ห้ามแก้)
            const bookingDateTime = new Date(`${data.date}T${data.startTime}`);
            if (bookingDateTime < new Date()) {
              alert("ขออภัย ตั๋วใบนี้หมดเวลาแก้ไขเนื่องจากเลยเวลาเริ่มเตะไปแล้ว");
              return router.push("/my-tickets");
            }

            setOldBooking(data);
            setDate(data.date);
            setStartTime(data.startTime);
            setEndTime(data.endTime);
            setPlayerCount(data.playerCount);
            setBookingType(data.bookingType);
          }
        } catch (err) { console.error("Error fetching old booking:", err); }
      }
      setLoading(false);
    };
    fetchData();
  }, [params.id, editId]);

  useEffect(() => {
    if (date) {
      fetch(`/api/fields/${params.id}/booked-slots?date=${date}`)
        .then((res) => res.json())
        .then((data) => setBookedSlots(data))
        .catch((err) => console.error(err));
    }
  }, [date, params.id]);

  const calculateTotal = () => {
    if (!field) return 0;
    const start = parseInt(startTime.split(":")[0]);
    const end = parseInt(endTime.split(":")[0]);
    if (end <= start) return 0;
    const duration = end - start;
    const pricePerPerson = session ? field.memberPrice : field.price;
    const discount = bookingType === "TEAM" && playerCount >= 6 ? 0.9 : 1;
    return duration * pricePerPerson * playerCount * discount;
  };

  const newTotal = calculateTotal();
  const creditAmount = oldBooking?.totalPrice || 0; // ยอดเงินเดิมที่จ่ายแล้ว
  const balanceToPay = newTotal - creditAmount; // ยอดที่ต้องจ่ายเพิ่ม

  const handleBooking = async () => {
    if (!date) return alert("กรุณาเลือกวันที่");
    // ถ้าแก้ไขและต้องจ่ายเพิ่มแต่ไม่มีสลิป
    if (balanceToPay > 0 && !slipFile) return alert("กรุณาแนบสลิปโอนเงินส่วนต่าง");

    setIsUploading(true);
    try {
      let slipUrl = oldBooking?.slipUrl || ""; // ใช้สลิปเก่าเป็นค่าเริ่มต้น

      if (slipFile) {
        const fileName = `${Date.now()}-${slipFile.name}`;
        await supabase.storage.from("field-images").upload(fileName, slipFile);
        const { data: publicUrl } = supabase.storage.from("field-images").getPublicUrl(fileName);
        slipUrl = publicUrl.publicUrl;
      }

      // เลือกใช้ API และ Method ตามโหมด (จองใหม่ POST / แก้ไข PATCH)
      const endpoint = editId ? `/api/bookings/${editId}` : "/api/bookings";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: params.id,
          userId: (session as any)?.user?.id || null,
          date, startTime, endTime, playerCount, bookingType,
          slipUrl,
          newTotalPrice: newTotal,
          additionalPayment: balanceToPay > 0 ? balanceToPay : 0
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "ดำเนินการไม่สำเร็จ");
      router.push("/tickets/" + (editId || result.id));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/my-tickets" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-6 font-medium">
          <ArrowLeft size={20} /> กลับไปที่ตั๋วของฉัน
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-zinc-100 overflow-hidden">
              <div className="h-64 md:h-80 bg-zinc-900 relative">
                <img src={field.imageUrl} className="w-full h-full object-cover opacity-80" alt="Field" />
                <div className="absolute bottom-0 left-0 p-8 bg-gradient-to-t from-black/90 w-full text-white">
                  {editId && <span className="bg-orange-500 px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block">โหมดแก้ไขการจอง</span>}
                  <h1 className="text-3xl font-bold">{field.name}</h1>
                </div>
              </div>

              {/* ตารางเวลา (Slot Grid) ยังคงเหมือนเดิมเพื่อให้เลือกเวลาใหม่ได้ */}
              <div className="p-8">
                <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                  <Clock className="text-blue-600" size={20} /> สถานะที่ว่าง (เลือกเวลาใหม่ได้)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {timeSlots.map((time) => {
                    const isSelected = startTime === time;
                    const isFull = (bookedSlots.find(s => s.startTime === time)?.totalPlayers || 0) >= maxCapacity;
                    return (
                      <button key={time} disabled={isFull} onClick={() => setStartTime(time)} 
                        className={`p-4 rounded-2xl border-2 transition-all ${isSelected ? "border-blue-600 bg-blue-50" : "border-zinc-100 bg-white"}`}>
                        <span className="text-xs font-bold block mb-1 text-zinc-500">{time}</span>
                        <span className="text-lg font-black">{bookedSlots.find(s => s.startTime === time)?.totalPlayers || 0}/{maxCapacity}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-xl sticky top-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 italic">
                {editId ? <RefreshCw className="text-orange-500" /> : <Calendar className="text-blue-600" />}
                {editId ? "แก้ไขข้อมูลการจอง" : "จองสนามใหม่"}
              </h3>
              
              <div className="space-y-5">
                {/* 1. เลือกวันที่ */}
                <input type="date" min={today} value={date} className="w-full p-4 bg-zinc-50 border rounded-xl outline-none" onChange={(e) => setDate(e.target.value)} />

                {/* 2. เลือกประเภทและจำนวนคน */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => {setBookingType("SOLO"); setPlayerCount(1)}} className={`py-3 rounded-xl border-2 font-bold ${bookingType === "SOLO" ? "border-blue-600 bg-blue-50 text-blue-600" : "text-zinc-400"}`}>จองเดี่ยว</button>
                  <button onClick={() => {setBookingType("TEAM"); setPlayerCount(6)}} className={`py-3 rounded-xl border-2 font-bold ${bookingType === "TEAM" ? "border-blue-600 bg-blue-50 text-blue-600" : "text-zinc-400"}`}>จองทีม</button>
                </div>

                {/* ✨ ส่วนแสดงการคำนวณเครดิตเดิม */}
                <div className="bg-zinc-900 text-white p-6 rounded-[1.5rem] text-center">
                  <div className="flex justify-between text-[10px] text-zinc-400 font-bold uppercase mb-2 border-b border-zinc-800 pb-2">
                    <span>ยอดรวมใหม่: ฿{newTotal}</span>
                    <span className="text-green-400">หักเครดิตเดิม: -฿{creditAmount}</span>
                  </div>
                  
                  <p className="text-zinc-400 text-xs mb-1 uppercase">ยอดที่ต้องชำระเพิ่ม</p>
                  <p className="text-4xl font-black mb-6 text-blue-400">฿{balanceToPay > 0 ? balanceToPay : 0}</p>

                  {/* QR Code จะเปลี่ยนตามยอดที่ต้องจ่ายเพิ่ม (Balance) */}
                  {(balanceToPay > 0 || !editId) && (
                    <div className="mb-6 p-4 bg-white rounded-2xl text-zinc-900">
                      <img src={`https://promptpay.io/0919323040/${balanceToPay > 0 ? balanceToPay : newTotal}`} alt="QR" className="w-32 h-32 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-zinc-400">สแกนเพื่อจ่ายส่วนต่าง</p>
                    </div>
                  )}

                  <label className="mb-4 block w-full cursor-pointer bg-zinc-800 border-dashed border border-zinc-600 rounded-xl p-3 text-zinc-300 text-sm">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} />
                    {slipFile ? "แนบสลิปใหม่แล้ว ✅" : (balanceToPay > 0 ? "แนบสลิปส่วนต่าง" : "แนบหลักฐานการโอน")}
                  </label>

                  <button onClick={handleBooking} disabled={isUploading || newTotal === 0} 
                    className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${editId ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-500"}`}>
                    {isUploading ? <Loader2 className="animate-spin" /> : (editId ? "ยืนยันการแก้ไขข้อมูล" : "ยืนยันการจองสนาม")}
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
