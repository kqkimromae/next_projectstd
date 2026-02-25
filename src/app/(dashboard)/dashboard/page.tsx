import { getFields, createBooking } from "../../../actions/bookings";

export default async function Dashboard() {
  // เรียก Controller เพื่อเอาข้อมูล (Model)
  const fields = await getFields();

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-8">เลือกสนามที่ต้องการจอง</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {fields.map((field) => (
          <div
            key={field.id}
            className="border p-4 rounded-lg shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold">{field.name}</h2>
            <p className="text-gray-600">{field.description}</p>
            <p className="text-blue-600 font-bold mt-2">
              {field.price} บาท/ชม.
            </p>

            {/* Form เล็กๆ สำหรับกดจอง (เชื่อมกับ Controller) */}
            <form
              action={async (formData) => {
                "use server";
                // ในโค้ดจริงควรใช้ Client Component เพื่อจัดการ State ของเวลา
                const start = new Date().toISOString(); // Demo: จองเวลาปัจจุบัน
                const end = new Date(Date.now() + 3600000).toISOString();
                await createBooking(field.id, start, end);
              }}
            >
              <button className="mt-4 w-full bg-green-500 text-white py-2 rounded">
                จองทันที
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
