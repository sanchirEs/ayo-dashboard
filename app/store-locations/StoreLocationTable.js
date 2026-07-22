"use server";
import Image from "next/image";
import Link from "next/link";
import { getStoreLocations } from "@/lib/api/storeLocations";
import StoreLocationRowActions from "./StoreLocationRowActions";

const COL = {
  image:    { width: "56px",  flexShrink: 0 },
  name:     { width: "180px", flexShrink: 0 },
  address:  { flex: 1,        minWidth: 0 },
  schedule: { width: "175px", flexShrink: 0 },
  phone:    { width: "105px", flexShrink: 0 },
  order:    { width: "70px",  flexShrink: 0, textAlign: "center" },
  actions:  { width: "80px",  flexShrink: 0 },
};

export default async function StoreLocationTable() {
  const locations = await getStoreLocations();

  return (
    <div className="wg-table table-all-attribute">
      <ul className="table-title flex gap20 mb-14" style={{ alignItems: "center" }}>
        <li style={COL.image}><div className="body-title">Зураг</div></li>
        <li style={COL.name}><div className="body-title">Нэр / Дүүрэг</div></li>
        <li style={COL.address}><div className="body-title">Хаяг</div></li>
        <li style={COL.schedule}><div className="body-title">Цагийн хуваарь</div></li>
        <li style={COL.phone}><div className="body-title">Утас</div></li>
        <li style={COL.order}><div className="body-title">Дараалал</div></li>
        <li style={COL.actions}><div className="body-title">Үйлдэл</div></li>
      </ul>

      <ul className="flex flex-column">
        {locations.length ? (
          locations.map((loc) => (
            <li key={loc.id} className="attribute-item flex items-start gap20">

              {/* Image */}
              <div style={COL.image}>
                {loc.image ? (
                  <Image
                    src={loc.image}
                    alt={loc.name}
                    width={56}
                    height={56}
                    style={{ objectFit: "cover", borderRadius: "8px", width: "56px", height: "56px", display: "block" }}
                  />
                ) : (
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "8px",
                    backgroundColor: "#f3f4f6", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <i className="icon-image" style={{ color: "#9ca3af" }} />
                  </div>
                )}
              </div>

              {/* Name + District */}
              <div style={COL.name}>
                <div className="body-title-2" style={{ wordBreak: "break-word" }}>{loc.name}</div>
                <div className="text-tiny" style={{ color: "#6b7280", marginTop: "2px" }}>{loc.district}</div>
              </div>

              {/* Address */}
              <div style={COL.address}>
                <div className="text-tiny" style={{ color: "#374151", lineHeight: "1.5", wordBreak: "break-word" }}>
                  {loc.address}
                </div>
                {loc.googleMapLink && (
                  <a
                    href={loc.googleMapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tiny"
                    style={{ color: "#3b82f6", marginTop: "4px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <i className="icon-map-pin" style={{ fontSize: "11px" }} />
                    Google Map
                  </a>
                )}
              </div>

              {/* Schedule */}
              <div style={COL.schedule}>
                <div className="text-tiny" style={{ color: "#374151", lineHeight: "1.5" }}>{loc.hours}</div>
                {loc.lunchBreak && (
                  <div className="text-tiny" style={{ color: "#9ca3af", fontStyle: "italic", marginTop: "2px" }}>
                    {loc.lunchBreak}
                  </div>
                )}
                {loc.closedDay && (
                  <div className="text-tiny" style={{ color: "#dc2626", marginTop: "2px" }}>
                    {loc.closedDay}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div style={COL.phone}>
                <div className="text-tiny" style={{ color: "#374151", fontWeight: 500 }}>{loc.phone}</div>
              </div>

              {/* Sort order */}
              <div style={COL.order}>
                <span className="body-title-2">{loc.sortOrder}</span>
              </div>

              {/* Actions */}
              <div style={COL.actions}>
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
