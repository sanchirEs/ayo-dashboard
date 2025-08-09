import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    const session = await auth();
    const token = session?.user?.accessToken ? `Bearer ${session.user.accessToken}` : "";

    if (!id) {
      return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 });
    }

    const res = await fetch(`${require("@/lib/api/env").getBackendUrl()}/api/v1/categories/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: token,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: false, message: data?.message || "Delete failed" }, { status: res.status });
    }
    return NextResponse.redirect(new URL("/category-list", request.url));
  } catch (e) {
    return NextResponse.json({ success: false, message: "Unexpected error" }, { status: 500 });
  }
}


