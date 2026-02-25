"use client";
import { useState, useEffect } from "react";
import { Calendar, Clock, Users, Save, Upload, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function EditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [formData, setFormData] = useState({ date: "", startTime: "", players: 1 });
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const PRICE_PER_PERSON = 60; 

  useEffect(() => {
    fetch(`/api/bookings/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setBooking(data);
          setFormData({ date: data.date, startTime: data.startTime, players: data.playerCount });
        }
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!booking) return <div className="text-center p-20">ไม่พบข้อมูลการจอง</div>;

  const newTotal = formData.players * PRICE_PER_PERSON;
  const balance = newTotal - booking.totalPrice;

  const handleSave = async () => {
    if (balance > 0 && !slipFile) return alert("กรุณาแนบสลิปโอนเงินส่วนต่าง");

    setIsSaving(true);
    try {
      let currentSlipUrl = booking.slipUrl;

      if (slipFile && balance > 0) {
        const fileName = `${Date.now()}-extra-${slipFile.name}`;
        await supabase.storage.from("field-images").upload(fileName, slipFile);
        const { data } = supabase.storage.from("field-images").getPublicUrl(fileName);
        currentSlipUrl = data.publicUrl;
      }

      // ยิงไปที่ /api/bookings/[id] โดยตรง (ไม่ต้องมี /edit ต่อท้าย)
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newDate: formData.date,
          newStartTime: formData.startTime,
          newPlayerCount: formData.players,
          newTotalPrice: newTotal,
          slipUrl: currentSlipUrl,
          status: balance > 0 ? "PENDING" : booking.status
        })
      });

      if (res.ok) {
        alert("บันทึกการแก้ไขเรียบร้อย!");
        router.push(`/tickets/${params.id}`);
        router.refresh();
      } else {
        alert("เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-[2.5rem] shadow-2xl mt-10 mb-10 border border-zinc-100 font-sans">
      <button onClick={() => router.back()} className="mb-4 text-zinc-400 hover:text-zinc-900 flex items-center gap-1 text-sm font-bold">
        <ArrowLeft size={16}/> กลับ
      </button>
      <h2 className="text-2xl font-black mb-6 text-zinc-900 italic uppercase">Edit Booking</h2>
      
      <div className="space-y-4">
        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
          <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1 mb-1">
            <Calendar size={12}/> วันที่ใหม่
          </label>
          <input type="date" className="w-full bg-transparent font-bold outline-none" 
            value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
            <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1 mb-1">
              <Clock size={12}/> เวลา
            </label>
            <input type="time" className="w-full bg-transparent font-bold outline-none"
              value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
          </div>
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
            <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1 mb-1">
              <Users size={12}/> จำนวนคน
            </label>
            <input type="number" className="w-full bg-transparent font-bold outline-none"
              value={formData.players} onChange={e => setFormData({...formData, players: Number(e.target.value)})} />
          </div>
        </div>

        <div className={`p-6 rounded-[2rem] border-2 border-dashed ${balance > 0 ? 'bg-zinc-900 text-white border-blue-500' : 'bg-green-50 border-green-200'}`}>
          <div className="flex justify-between text-[10px] font-bold uppercase opacity-60 mb-2">
            <span>จ่ายแล้ว: ฿{booking.totalPrice}</span>
            <span>ยอดใหม่: ฿{newTotal}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold uppercase text-xs">จ่ายเพิ่ม:</span>
            <span className={`text-4xl font-black italic ${balance > 0 ? 'text-blue-400' : 'text-green-600'}`}>
              ฿{balance > 0 ? balance : 0}
            </span>
          </div>

          {balance > 0 && (
            <div className="mt-4 bg-white p-4 rounded-2xl text-center">
              <img src={`https://promptpay.io/0919323040/${balance}`} alt="QR" className="w-32 h-32 mx-auto mb-2" />
              <label className="mt-3 block w-full cursor-pointer bg-zinc-100 border border-dashed rounded-xl p-2 text-zinc-900 text-[10px] font-bold">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} />
                <div className="flex items-center justify-center gap-1">
                   <Upload size={12} /> {slipFile ? "แนบสลิปแล้ว ✅" : "แนบสลิปส่วนต่าง"}
                </div>
              </label>
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={isSaving} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all flex justify-center items-center gap-2">
          {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
          {isSaving ? "SAVING..." : "CONFIRM EDIT"}
        </button>
      </div>
    </div>
  );
}