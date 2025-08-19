import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/api/env";

export async function GET() {
  try {
    const base = getBackendUrl();
    const res = await fetch(`${base}/api/v1/attributes`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Unexpected error" }, { status: 500 });
  }
}


