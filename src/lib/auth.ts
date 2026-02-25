// file: lib/auth.ts

import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) return null;
        // อย่าลืมเช็ค password ด้วย bcrypt.compare ในอนาคตนะครับ
        return user;
      }
    })
  ],
  callbacks: {
    // 👈 จุดที่ต้องแก้คือตรงนี้
    async redirect({ url, baseUrl }) {
      // เมื่อ Login สำเร็จ จะดีดผู้ใช้ไปที่หน้าแรกสุด (src/app/page.tsx)
      return baseUrl; 
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      return token;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET, // อย่าลืมใส่ Secret ด้วยครับ
};