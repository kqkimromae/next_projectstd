//src/app/api/bookings/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fieldId, userId, date, startTime, endTime,
      guestName, guestPhone, slipUrl, playerCount, bookingType,
    } = body;

    // 1. เช็คข้อมูลครบ
    if (!fieldId || !date || !startTime || !endTime) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const dateString = typeof date === "string"
      ? date.split("T")[0]
      : new Date(date).toISOString().split("T")[0];

    // ✅ 2. เช็คว่า date อยู่ในช่วง min-max (พรุ่งนี้ ถึง 3 วันข้างหน้า)
    const minDate = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 3);

    const minDateStr = minDate.toISOString().split("T")[0];
    const maxDateStr = maxDate.toISOString().split("T")[0];

    if (dateString < minDateStr || dateString > maxDateStr) {
      return NextResponse.json(
        { message: `จองได้เฉพาะ 3 วันข้างหน้าเท่านั้น (${minDateStr} ถึง ${maxDateStr})` },
        { status: 400 }
      );
    }

    // 3. ดึงข้อมูลสนาม
    const field = await prisma.field.findUnique({ where: { id: fieldId } });
    if (!field) {
      return NextResponse.json({ message: "ไม่พบข้อมูลสนาม" }, { status: 404 });
    }

    const maxCapacity = field.capacity || 12;

    // 4. เช็ค capacity
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

    if (currentReserved + (playerCount || 1) > maxCapacity) {
      return NextResponse.json(
        { message: `ขออภัย สนามเต็มแล้ว (ว่างอีกเพียง ${maxCapacity - currentReserved} ที่)` },
        { status: 400 }
      );
    }

    // 5. คำนวณราคา
    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);
    const duration = endHour - startHour;
    const pricePerPerson = userId ? field.memberPrice : field.price;
    const discount = (bookingType === "TEAM" && playerCount >= 6) ? 0.9 : 1;
    const totalPrice = pricePerPerson * duration * (playerCount || 1) * discount;

    // 6. บันทึก DB
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

    return NextResponse.json(booking, { status: 201 });

  } catch (error: any) {
    console.error("Booking Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาด: " + error.message },
      { status: 500 }
    );
  }
}
