import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/api/env";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.accessToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${getBackendUrl()}/api/v1/products/${id}/toggle-active`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ message: data?.message || `Toggle failed (${res.status})` }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}
