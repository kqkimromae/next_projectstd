import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fieldId,
      userId,
      date,
      startTime,
      endTime,
      guestName,
      guestPhone,
      slipUrl,
      playerCount,
      bookingType,
    } = body;

    // 1. ตรวจสอบข้อมูลเบื้องต้น
    if (!fieldId || !date || !startTime || !endTime) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // 2. ดึงข้อมูลสนามเพื่อเช็ค Capacity และราคา
    const field = await prisma.field.findUnique({ where: { id: fieldId } });
    if (!field) {
      return NextResponse.json({ message: "ไม่พบข้อมูลสนาม" }, { status: 404 });
    }

    const dateString = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];
    
    // ใช้ค่าความจุจาก DB ของสนามนั้นๆ (ถ้าไม่มีใส่ default ไว้ที่ 12)
    const maxCapacity = field.capacity || 12; 

    // 3. เช็คจำนวนคนจองสะสมในรอบเวลานี้
    const bookingsInSlot = await prisma.booking.findMany({
      where: {
        fieldId,
        date: dateString,
        startTime,
        status: { in: ["PENDING", "PAID", "CONFIRMED"] },
      },
      select: { playerCount: true }
    });

    const currentReserved = bookingsInSlot.reduce((sum, b) => sum + (b.playerCount || 0), 0);

    // ตรวจสอบว่าที่ว่างพอไหม
    if (currentReserved + (playerCount || 1) > maxCapacity) {
      return NextResponse.json(
        { message: `ขออภัย สนามเต็มแล้ว (ว่างอีกเพียง ${maxCapacity - currentReserved} ที่)` },
        { status: 400 }
      );
    }

    // 4. คำนวณราคา
    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);
    const duration = endHour - startHour;
    
    // ราคาต่อหัว
    const pricePerPerson = userId ? field.memberPrice : field.price;
    
    // ส่วนลดพิเศษถ้าจองเป็นทีม (6 คนขึ้นไป ลด 10%)
    const discount = (bookingType === "TEAM" && playerCount >= 6) ? 0.9 : 1;
    const totalPrice = pricePerPerson * duration * (playerCount || 1) * discount;

    // 5. บันทึกลงฐานข้อมูล
    const booking = await prisma.booking.create({
      data: {
        fieldId,
        userId: userId || null,
        date: dateString,
        startTime,
        endTime,
        playerCount: playerCount || 1,
        bookingType: bookingType || "SOLO",
        guestName: guestName || null,
        guestPhone: guestPhone || null,
        totalPrice,
        slipUrl: slipUrl || null,
        status: slipUrl ? "PENDING" : "UNPAID", 
      },
    });

    // ✨ จุดที่แก้ไข: ส่ง object 'booking' กลับไปตรงๆ 
    // เพื่อให้หน้าบ้านได้รับ id (เช่น result.id) แล้วเปลี่ยนหน้าไป /tickets/[id] ได้ถูกต้อง
    return NextResponse.json(booking, { status: 201 });

  } catch (error: any) {
    console.error("Booking Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาด: " + error.message },
      { status: 500 },
    );
  }
}