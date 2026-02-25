import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const fields = [
    { name: "สนามแบดมินตัน 1", description: "สนามพื้นยางมาตรฐาน", price: 200 },
    { name: "สนามแบดมินตัน 2", description: "สนามพื้นยางมาตรฐาน", price: 200 },
    { name: "สนามแบดมินตัน 3", description: "สนามพื้นยางมาตรฐาน", price: 200 },
    { name: "สนามแบดมินตัน 4", description: "สนามพื้นยางมาตรฐาน", price: 200 },
    { name: "สนามฟุตซอล 1", description: "สนามในร่ม หญ้าเทียม", price: 600 },
    { name: "สนามฟุตซอล 2", description: "สนามในร่ม หญ้าเทียม", price: 600 },
    { name: "สนามบาสเกตบอล 1", description: "สนามพื้นปาร์เก้", price: 500 },
    { name: "สนามบาสเกตบอล 2", description: "สนามพื้นปาร์เก้", price: 500 },
    { name: "สนามตะกร้อ 1", description: "สนามมาตรฐาน", price: 150 },
    { name: "สนามตะกร้อ 2", description: "สนามมาตรฐาน", price: 150 },
    { name: "สนามฟุตบอลใหญ่", description: "สนามหญ้าจริง 11 คน", price: 1500 },
    { name: "สนามศิลปะการต่อสู้ 1", description: "มีเบาะและเวที", price: 400 },
    { name: "สนามศิลปะการต่อสู้ 2", description: "มีเบาะและเวที", price: 400 },
  ];

  console.log("กำลังเริ่มเติมข้อมูลสนาม...");

  for (const f of fields) {
    await prisma.field.create({
      data: f,
    });
  }

  console.log("เติมข้อมูลสนามทั้ง 13 แห่งสำเร็จแล้ว! ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
