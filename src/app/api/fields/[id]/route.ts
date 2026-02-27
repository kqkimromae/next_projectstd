//src/app/api/fields/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // 1. วิ่งไปเปิดดูสมุด (Database) ว่าสนาม ID นี้ ราคาเท่าไหร่
    const field = await prisma.field.findUnique({
      where: { id: params.id },
    });

    // 2. ถ้าหาไม่เจอ ให้บอกว่า "ไม่มีข้อมูล"
    if (!field) {
      return NextResponse.json({ message: "หาเลขในระบบไม่เจอ" }, { status: 404 });
    }

    // 3. ถ้าเจอแล้ว ส่งเลข (200, 600, 150) ออกไปให้หน้าเว็บ
    return NextResponse.json(field);
  } catch (error) {
    return NextResponse.json({ message: "ระบบหลังบ้านพัง" }, { status: 500 });
  }
}