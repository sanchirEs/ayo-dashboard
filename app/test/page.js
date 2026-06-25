"use client";
import Layout from "@/components/layout/Layout";

export default function SidebarTest() {
  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Sidebar Overlay Test</h1>
        <p className="text-gray-600">Click the arrow button (→) in the top-left of the header to open the sidebar overlay.</p>
        <p className="text-gray-600 mt-2">The sidebar should slide in from the left on top of this content, with a dark backdrop behind it.</p>
      </div>
    </Layout>
  );
}
