import getToken from "@/lib/GetTokenServer";
import { getSheetRows } from "@/lib/api/sheetPayments";
import SheetTableClient from "./SheetTableClient";

export default async function SheetTable({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const q = params?.q || "";
  const page = parseInt(params?.page) || 1;

  const token = await getToken();

  try {
    const data = await getSheetRows({ q, page, limit: 50 }, token);
    return <SheetTableClient initialData={data} initialToken={token} />;
  } catch (error) {
    return (
      <div className="wg-table table-all-category">
        <div className="text-center py-8" style={{ color: "#ef4444" }}>
          Өгөгдөл ачаалахад алдаа гарлаа: {error.message}
        </div>
      </div>
    );
  }
}
