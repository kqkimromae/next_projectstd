//src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body; // รับค่า name มาจากหน้า Register

    // 1. ตรวจสอบว่ากรอกข้อมูลครบไหม
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, อีเมล, รหัสผ่าน)" },
        { status: 400 },
      );
    }

    // 2. ตรวจสอบว่ามีอีเมลนี้ในระบบหรือยัง
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 400 },
      );
    }

    // 3. เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. บันทึกลง Database (ตรวจสอบว่าใน schema.prisma ฟิลด์ชื่อ name จริงหรือไม่)
    const user = await prisma.user.create({
      data: {
        name: name, // ตรวจสอบตัวสะกดตรงนี้ให้ตรงกับ Schema
        email: email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "สมัครสมาชิกสำเร็จ!", userId: user.id },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาด: " + error.message },
      { status: 500 },
    );
  }
}
