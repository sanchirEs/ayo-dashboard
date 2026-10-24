"use client";

/** A4 падаан for signature: Төв hands it over, the partner signs on receipt. */

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getDelivery } from "@/lib/api/partners";
import { formatDate, formatMnt } from "@/lib/partners/format";

const page = {
  width: "210mm",
  minHeight: "297mm",
  margin: "0 auto",
  padding: "16mm 14mm",
  backgroundColor: "#fff",
  color: "#000",
  fontSize: "11pt",
  fontFamily: "Arial, sans-serif",
  boxSizing: "border-box",
};

const cell = { border: "1px solid #000", padding: "5px 7px", fontSize: "10pt" };
const plain = { border: "none", padding: "2px 0" };

export default function PrintDelivery({ id }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    getDelivery(id, token).then(setDelivery, (e) => setError(e.message));
  }, [token, id]);

  if (error) return <div style={{ padding: 24, fontSize: 16, color: "#dc2626" }}>{error}</div>;
  if (!delivery) return <div style={{ padding: 24, fontSize: 16 }}>Ачаалж байна…</div>;

  const pieces = delivery.lines.reduce((s, l) => s + l.qty, 0);

  return (
    <div style={{ backgroundColor: "#e5e7eb", minHeight: "100vh", padding: "16px 0" }} className="print-root">
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { background: #fff !important; }
          .print-root { background: #fff !important; padding: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="no-print" style={{ textAlign: "center", marginBottom: 12 }}>
        <button type="button" onClick={() => window.print()} style={{ padding: "10px 22px", fontSize: 16, borderRadius: 8, border: "none", backgroundColor: "#2563eb", color: "#fff", cursor: "pointer" }}>
          Хэвлэх
        </button>
      </div>
      <div style={page}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8mm" }}>
          {/* The dashboard's public/images/logo is the Remos template's, not Ayo's. */}
          <div style={{ fontSize: "20pt", fontWeight: 800, letterSpacing: "0.08em" }}>AYO COSMETICS</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "16pt", fontWeight: 700 }}>ПАДААН {delivery.number}</div>
            <div>Огноо: {formatDate(delivery.sentAt)}</div>
          </div>
        </div>

        <table style={{ width: "100%", marginBottom: "6mm", fontSize: "11pt", border: "none" }}>
          <tbody>
            <tr>
              <td style={{ ...plain, width: "32mm", color: "#444" }}>Илгээгч:</td>
              <td style={plain}>Ayo Cosmetics · {delivery.fromLocation.name}</td>
            </tr>
            <tr>
              <td style={{ ...plain, color: "#444" }}>Хүлээн авагч:</td>
              <td style={{ ...plain, fontWeight: 700 }}>{delivery.partner.name}</td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            {/* The template would otherwise give every column the same width. */}
            {["9mm", "auto", "18mm", "18mm", "26mm", "30mm"].map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {["№", "Бараа", "Хайрцаг", "Тоо (ш)", "Нэгж үнэ", "Дүн"].map((h, i) => (
                <th key={h} style={{ ...cell, textAlign: i > 1 ? "right" : "left", backgroundColor: "#f3f4f6" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {delivery.lines.map((l, i) => (
              <tr key={l.id}>
                <td style={cell}>{i + 1}</td>
                <td style={cell}>{l.nameSnapshot}</td>
                <td style={{ ...cell, textAlign: "right" }}>{l.boxes ?? ""}</td>
                <td style={{ ...cell, textAlign: "right" }}>{l.qty}</td>
                <td style={{ ...cell, textAlign: "right" }}>{formatMnt(l.unitPrice)}</td>
                <td style={{ ...cell, textAlign: "right" }}>{formatMnt(l.lineTotal)}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...cell, fontWeight: 700 }} colSpan={3}>Нийт</td>
              <td style={{ ...cell, textAlign: "right", fontWeight: 700 }}>{pieces}</td>
              <td style={cell} />
              <td style={{ ...cell, textAlign: "right", fontWeight: 700 }}>{formatMnt(delivery.total)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "space-between", gap: "20mm", marginTop: "22mm" }}>
          {["Хүлээлгэн өгсөн", "Хүлээн авсан"].map((label) => (
            <div key={label} style={{ flex: 1 }}>
              <div>{label}:</div>
              <div style={{ borderBottom: "1px solid #000", height: "12mm" }} />
              <div style={{ fontSize: "9pt", color: "#444", marginTop: 3 }}>(нэр, гарын үсэг)</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
