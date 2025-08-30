import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/api/env";

export async function GET() {
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/tag-groups`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
    const json = await res.json();
    return NextResponse.json(json);
  } catch (e) {
    console.error("Error proxying tag groups request", e);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
