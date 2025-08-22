import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    const force = searchParams.get("force") === "true"; // New force parameter
    const session = await auth();
    const token = session?.user?.accessToken ? `Bearer ${session.user.accessToken}` : "";

    if (!id) {
      return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 });
    }

    // Check if user is admin for force delete
    const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
    
    // Build the URL with force parameter if admin and force is requested
    let deleteUrl = `${require("@/lib/api/env").getBackendUrl()}/api/v1/categories/${id}`;
    if (force && isAdmin) {
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
    
    // FIX: Use environment variables to get the correct base URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || "https://ayo-dashboard-production.up.railway.app";
    return NextResponse.redirect(new URL("/category-list", baseUrl));
  } catch (e) {
    return NextResponse.json({ success: false, message: "Unexpected error" }, { status: 500 });
  }
}


