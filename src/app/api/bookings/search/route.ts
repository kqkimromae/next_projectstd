import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q"); // รับค่าที่ค้นหา

    if (!query) return NextResponse.json([], { status: 400 });
const today = new Date().toISOString().split('T')[0];
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { guestPhone: query },         // ค้นหาด้วยเบอร์โทร
          { accessCode: query },        // ค้นหาด้วยรหัสเข้าสนาม (UUID)
          { id: query }                  // ค้นหาด้วย ID การจอง
        ]
      },
      include: {
        field: true, // ดึงข้อมูลสนามมาโชว์ด้วย
      },
      orderBy: {
        createdAt: 'desc' // เอาที่จองล่าสุดขึ้นก่อน
      }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}