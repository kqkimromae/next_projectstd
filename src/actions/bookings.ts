// src/actions/bookings.ts
"use server";

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function getFields() {
  return await prisma.field.findMany();
}

export async function createBooking(
  fieldId: string,
  startTime: string,
  endTime: string,
) {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("userId");

  // เช็คก่อนว่ามี Cookie ไหม
  if (!userIdCookie || !userIdCookie.value) {
    throw new Error("Unauthorized: No User Found");
  }

  const userId = userIdCookie.value;

  await prisma.booking.create({
    data: {
      userId, // ตอนนี้มั่นใจแล้วว่าเป็น string แน่นอน
      fieldId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard");
}
