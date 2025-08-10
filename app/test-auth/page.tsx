import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function TestAuthPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      <div className="bg-green-100 p-4 rounded">
        <h2 className="font-semibold">✅ Authentication Working!</h2>
        <p>User: {session.user.email}</p>
        <p>Role: {session.user.role}</p>
        <p>ID: {session.user.id}</p>
      </div>
    </div>
  );
}
