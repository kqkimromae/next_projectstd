//src/app/api/admin/bookings/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- ของเดิมที่คุณมี (GET) เก็บไว้ได้ครับ ---
export async function GET() {
  const today = new Date().toISOString().split('T')[0];

  // 1. อัปเดตตั๋วที่วันที่น้อยกว่าวันนี้ และสถานะไม่ใช่ PAID ให้เป็น EXPIRED (หรือตามตรรกะของคุณ)
  await prisma.booking.updateMany({
    where: {
      date: { lt: today }, // lt = Less Than (น้อยกว่าวันนี้)
      status: { not: "PAID" } // เช่น ถ้ายังไม่จ่ายเงินให้หมดอายุทันที
    },
    data: {
      status: "EXPIRED"
    }
  });

  // 2. ดึงข้อมูลกลับไปโชว์ตามปกติ
  const bookings = await prisma.booking.findMany({
    include: { field: true, user: true },
    orderBy: { date: 'desc' }
  });

  return NextResponse.json(bookings);
}

// --- ส่วนที่ต้องเพิ่ม/แก้ไข เพื่อให้กดจองได้ (POST) ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fieldId, userId, date, startTime, endTime, guestName, guestPhone, slipUrl } = body;

    // 🚩 จุดสำคัญ: แก้ Error "Expected String, provided DateTime"
    // เราต้องบังคับให้ date เป็น String รูปแบบ YYYY-MM-DD ก่อนส่งให้ Prisma
    const dateString = typeof date === 'string' 
      ? date.split('T')[0] 
      : new Date(date).toISOString().split('T')[0];

    // 1. เช็คว่าสนามว่างไหมโดยใช้ dateString
    const existingBooking = await prisma.booking.findFirst({
      where: {
        fieldId,
        date: dateString, // ใช้ตัวแปรที่แปลงเป็น String แล้ว
        startTime,
        status: { in: ["PENDING", "PAID"] },
      },
    });

    if (existingBooking) {
      return NextResponse.json({ message: "เวลานี้ถูกจองไปแล้ว" }, { status: 400 });
    }

    // 2. บันทึกลงฐานข้อมูล
    const booking = await prisma.booking.create({
      data: {
        fieldId,
        userId: userId || null,
        date: dateString, // 🚩 ต้องส่งเป็น String เท่านั้น
        startTime,
        endTime,
        guestName: guestName || null,
        guestPhone: guestPhone || null,
        slipUrl: slipUrl || null,
        status: "PENDING",
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Booking Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}