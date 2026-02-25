import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "ต้องระบุวันที่" }, { status: 400 });
    }

    // 1. ดึงรายการจองทั้งหมดของสนามนั้นๆ ในวันที่เลือก
    const bookings = await prisma.booking.findMany({
      where: {
        fieldId: params.id,
        date: date,
        // เอาเฉพาะรายการที่มีผลต่อความจุสนาม
        status: { in: ["PENDING", "PAID"] }, 
      },
      select: {
        startTime: true,
        playerCount: true, // 👈 สำคัญ: ต้องเอาจำนวนคนมาคำนวณด้วย
      },
    });

    // 2. จัดกลุ่ม (Group By) และรวมจำนวนคน (Sum)
    // ผลลัพธ์ที่ได้จะเป็น: [{ startTime: "17:00", totalPlayers: 5 }, { startTime: "18:00", totalPlayers: 12 }]
    const aggregatedSlots = bookings.reduce((acc: any[], curr) => {
      const existingSlot = acc.find((s) => s.startTime === curr.startTime);
      
      if (existingSlot) {
        existingSlot.totalPlayers += curr.playerCount;
      } else {
        acc.push({
          startTime: curr.startTime,
          totalPlayers: curr.playerCount,
        });
      }
      return acc;
    }, []);

    return NextResponse.json(aggregatedSlots);
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}