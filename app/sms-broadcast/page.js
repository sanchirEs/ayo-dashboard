import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import SmsBroadcastClient from "./SmsBroadcastClient";
import { getBroadcasts } from "@/lib/api/smsBroadcast";

export default async function SmsBroadcastPage() {
  const res = await getBroadcasts();
  const initialBroadcasts = res?.data || [];

  return (
    <Layout breadcrumbTitleParent="Маркетинг" breadcrumbTitle="SMS Илгээх">
      <Suspense fallback={<div className="wg-box">Уншиж байна...</div>}>
        <SmsBroadcastClient initialBroadcasts={initialBroadcasts} />
      </Suspense>
    </Layout>
  );
}
