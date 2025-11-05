import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/api/env";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all');
    
    const url = new URL(`${getBackendUrl()}/api/v1/categories/`);
    if (all === 'true') {
      url.searchParams.set('all', 'true');
    }
    
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
    const json = await res.json();
    return NextResponse.json(json);
  } catch (e) {
    console.error("Error proxying categories request", e);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}

