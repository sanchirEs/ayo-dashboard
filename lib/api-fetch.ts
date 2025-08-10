import { auth } from "@/auth";

export async function apiFetch(path: string, init?: RequestInit) {
  const session = await auth();
  const baseUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  
  if (!baseUrl) {
    throw new Error("BACKEND_URL is not configured");
  }

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  
  if (session?.user?.accessToken) {
    headers.set("Authorization", `Bearer ${session.user.accessToken}`);
  }

  return fetch(`${baseUrl}${path}`, { 
    ...init, 
    headers 
  });
}
