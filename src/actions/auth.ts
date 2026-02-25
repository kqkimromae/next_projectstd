// src/actions/auth.ts
"use server";

import { prisma } from "../lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function register(formData: FormData) {
  // ใช้ as string เพื่อยืนยันกับ TS ว่ามีค่าแน่ๆ
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    throw new Error("Email and Password are required");
  }

  // ในการจริงต้อง Hash Password (ข้ามไปก่อนเพื่อความง่าย)
  await prisma.user.create({
    data: {
      email,
      password,
      role: "USER",
    },
  });

  redirect("/login");
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return; // กัน error ถ้าไม่มีค่า

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.password !== password) {
    // ใน Server Action ถ้า throw error เว็บอาจจะพัง
    // ปกติจะ return object error กลับไป (แต่เอาแบบนี้ก่อน)
    throw new Error("Invalid credentials");
  }

  const cookieStore = await cookies();

  // แปลงค่าเป็น string ให้หมด
  cookieStore.set("userId", user.id, { httpOnly: true });
  cookieStore.set("userRole", user.role, { httpOnly: true });

  if (user.role === "ADMIN") redirect("/admin");
  else redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("userId");
  cookieStore.delete("userRole");
  redirect("/login");
}
