"use server";
import Image from "next/image";
import Link from "next/link";
import { getStoreLocations } from "@/lib/api/storeLocations";
import StoreLocationRowActions from "./StoreLocationRowActions";

export default async function StoreLocationTable() {
  const locations = await getStoreLocations();

  return (
    <div className="wg-table table-all-attribute">
      <ul className="table-title flex gap20 mb-14">
        <li style={{ width: "60px" }}>
          <div className="body-title">Зураг</div>
        </li>
        <li className="flex-grow">
          <div className="body-title">Нэр / Дүүрэг</div>
        </li>
        <li style={{ width: "180px" }}>
          <div className="body-title">Хаяг</div>
        </li>
        <li style={{ width: "140px" }}>
          <div className="body-title">Цагийн хуваарь</div>
        </li>
        <li style={{ width: "100px" }}>
          <div className="body-title">Утас</div>
        </li>
        <li style={{ width: "60px" }}>
          <div className="body-title">Дараалал</div>
        </li>
        <li style={{ width: "80px" }}>
          <div className="body-title">Үйлдэл</div>
        </li>
      </ul>

      <ul className="flex flex-column">
        {locations.length ? (
          locations.map((loc) => (
            <li key={loc.id} className="attribute-item flex items-start gap20">
              <div style={{ width: "60px", flexShrink: 0 }}>
                {loc.image ? (
                  <Image
                    src={loc.image}
                    alt={loc.name}
                    width={56}
                    height={56}
                    style={{ objectFit: "cover", borderRadius: "8px", width: "56px", height: "56px" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "8px",
                      backgroundColor: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className="icon-image" style={{ color: "#9ca3af" }} />
                  </div>
                )}
              </div>

              <div className="flex-grow">
                <div className="body-title-2">{loc.name}</div>
                <div className="text-tiny" style={{ color: "#6b7280" }}>{loc.district}</div>
              </div>

              <div style={{ width: "180px" }}>
                <div className="text-tiny" style={{ color: "#6b7280", lineHeight: "1.4" }}>
                  {loc.address}
                </div>
              </div>

              <div style={{ width: "140px" }}>
                <div className="text-tiny">{loc.hours}</div>
                {loc.lunchBreak && (
                  <div className="text-tiny" style={{ color: "#9ca3af", fontStyle: "italic" }}>
                    {loc.lunchBreak}
                  </div>
                )}
                {loc.closedDay && (
                  <div className="text-tiny" style={{ color: "#dc2626" }}>
                    {loc.closedDay}
                  </div>
                )}
              </div>

              <div style={{ width: "100px" }}>
                <div className="text-tiny">{loc.phone}</div>
              </div>

              <div style={{ width: "60px", textAlign: "center" }}>
                <div className="body-title-2">{loc.sortOrder}</div>
              </div>

              <div style={{ width: "80px" }}>
                <StoreLocationRowActions id={loc.id} name={loc.name} />
              </div>
            </li>
          ))
        ) : (
          <li className="text-center py-4">
            <div className="body-text">Одоогоор салбар байхгүй байна.</div>
            <Link href="/store-locations/new" className="tf-button style-1 mt-4">
              Салбар нэмэх
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
