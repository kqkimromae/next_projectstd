//src/app/api/user/tickets/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth"; // 👈 ใช้ตัวที่เราแก้เมื่อกี้

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const tickets = await prisma.booking.findMany({
      where: {
        userId: (session.user as any).id, // ดึงเฉพาะของตัวเอง
      },
      include: {
        field: true, // ดึงข้อมูลสนามมาโชว์ชื่อสนามด้วย
      },
      orderBy: {
        createdAt: "desc", // เอาอันที่จองล่าสุดไว้บนสุด
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}