import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ดึงข้อมูลการจองเดิมมาโชว์ในฟอร์ม
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { field: true }
    });
    if (!booking) return NextResponse.json({ message: "ไม่พบข้อมูล" }, { status: 404 });
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

// รับค่าที่แก้ไขจากหน้า Edit มาบันทึก
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        date: body.newDate,           // ตรงกับ newDate ใน UI
        startTime: body.newStartTime,   // ตรงกับ newStartTime ใน UI
        playerCount: body.newPlayerCount,
        totalPrice: body.newTotalPrice,
        slipUrl: body.slipUrl,
        status: body.status,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: "Update Failed" }, { status: 500 });
  }
}