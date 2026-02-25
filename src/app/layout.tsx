import type { Metadata } from "next";
import { Inter } from "next/font/google"; // หรือ font ที่คุณใช้
import "./globals.css";
import { Providers } from "../components/Providers"; // 1. import ตรงนี้
import Navbar from "../components/Navbar"; // 2. import ตรงนี้

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ระบบจองสนามฟุตบอล",
  description: "จองง่าย จ่ายสะดวก",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 3. ครอบทุกอย่างด้วย Providers */}
        <Providers>
          {/* 4. ใส่ Navbar ไว้บนสุด */}
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
