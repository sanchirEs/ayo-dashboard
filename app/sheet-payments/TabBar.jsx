"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function TabBar({ tabs, activeTabId }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchTab(tabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    params.delete("page");
    params.delete("q");
    router.push(`/sheet-payments?${params.toString()}`);
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "0",
        flexWrap: "wrap",
        marginBottom: "20px",
        borderBottom: "2px solid #e5e7eb",
      }}
    >
      {tabs.map((tab) => {
        const active = tab.tabId === activeTabId;
        return (
          <button
            key={tab.tabId}
            onClick={() => switchTab(tab.tabId)}
            style={{
              padding: "8px 16px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: active ? 600 : 400,
              color: active ? "#3730a3" : "#6b7280",
              borderBottom: active ? "2px solid #3730a3" : "2px solid transparent",
              marginBottom: "-2px",
              whiteSpace: "nowrap",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#374151"; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#6b7280"; }}
          >
            {tab.displayName}
          </button>
        );
      })}
    </div>
  );
}
