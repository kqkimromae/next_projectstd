import NextAuth from "next-auth";
import { authOptions } from "../../../../lib/auth"; // 👈 Import จากไฟล์ที่เราเพิ่งสร้าง

const handler = NextAuth(authOptions);

// Next.js App Router ต้องการการ Export แบบ GET และ POST
export { handler as GET, handler as POST };