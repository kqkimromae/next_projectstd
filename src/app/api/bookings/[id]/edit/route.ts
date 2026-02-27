//src/app/api/bookings/[id]/edit/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    // อัปเดตข้อมูลการจองในฐานข้อมูล
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        date: body.newDate,
        startTime: body.newStartTime,
        playerCount: body.newPlayerCount,
        totalPrice: body.newTotalPrice,
        slipUrl: body.slipUrl,
        status: body.status, // PENDING ถ้าต้องตรวจสอบสลิปใหม่
      },
    });

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ message: "บันทึกข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}