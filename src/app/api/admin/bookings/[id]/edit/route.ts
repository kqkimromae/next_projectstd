import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { newDate, newStartTime, newPlayerCount } = await req.json();

    // 1. ดึงข้อมูลการจองเดิมและเช็คความจุสนาม
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { field: true }
    });

    if (!booking) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

    // 2. ตรวจสอบว่าใน "วัน/เวลาใหม่" สนามเต็มหรือยัง?
    const existingBookings = await prisma.booking.findMany({
      where: {
        fieldId: booking.fieldId,
        date: newDate,
        startTime: newStartTime,
        status: { in: ["PENDING", "PAID"] },
        id: { not: params.id } // ไม่นับตัวเอง
      }
    });

    const currentBookedCount = existingBookings.reduce((sum, b) => sum + b.playerCount, 0);
    const capacityLeft = booking.field.capacity - currentBookedCount;

    if (newPlayerCount > capacityLeft) {
      return NextResponse.json({ error: `สนามเต็มในเวลาดังกล่าว (เหลือที่ว่าง ${capacityLeft} ที่)` }, { status: 400 });
    }

    // 3. คำนวณส่วนต่างราคา (สมมติคนละ 60 บาท)
    const newTotalAmount = newPlayerCount * 60;
    const balanceToPay = newTotalAmount - booking.amountPaid;

    // 4. อัปเดตข้อมูล
    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: {
        date: newDate,
        startTime: newStartTime,
        playerCount: newPlayerCount,
        // ถ้ามีการย้ายวันหรือจ่ายเพิ่ม ให้กลับไปรอตรวจสอบ (PENDING)
        status: balanceToPay > 0 || newDate !== booking.date ? "PENDING" : booking.status,
      },
    });

    return NextResponse.json({ 
      message: "อัปเดตข้อมูลสำเร็จ", 
      balanceToPay, 
      booking: updated 
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}