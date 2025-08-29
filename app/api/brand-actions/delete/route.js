import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    const force = searchParams.get("force") === "true";
    const session = await auth();
    const token = session?.user?.accessToken ? `Bearer ${session.user.accessToken}` : "";

    if (!id) {
      return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 });
    }

    // Check if user is admin
    const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
    
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }
    
    // Build the URL with force parameter if force is requested
    let deleteUrl = `${require("@/lib/api/env").getBackendUrl()}/api/v1/brands/${id}`;
    if (force) {
      deleteUrl += "?force=true";
    }

    const res = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        Authorization: token,
      },
    });
    
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: false, message: data?.message || "Delete failed" }, { status: res.status });
    }
    
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || "https://ayo-dashboard-production.up.railway.app";
    return NextResponse.redirect(new URL("/brand-list", baseUrl));
  } catch (e) {
    return NextResponse.json({ success: false, message: "Unexpected error" }, { status: 500 });
  }
}
