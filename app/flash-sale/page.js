export const dynamic = "force-dynamic";

import Layout from "@/components/layout/Layout";
import GetTokenServer from "@/lib/GetTokenServer";
import FlashSaleForm from "./FlashSaleForm";
import FlashSaleList from "./FlashSaleList";
import CopyLinkButton from "./CopyLinkButton";

export const metadata = { title: 'Flash Sale Scheduler — Dashboard' };

export default async function FlashSalePage() {
  const token = await GetTokenServer();
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || '';
  const shareLink = `${frontendUrl}/flashsale`;

  return (
    <Layout breadcrumbTitleParent="Маркетинг" breadcrumbTitle="Flash Sale">
      <div className="flex items-center justify-between gap10 flex-wrap mb-20">
        <div>
          <h3 className="text-title">⚡ Flash Sale</h3>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 13 }}>
            Хуваалцах линк:{' '}
            <a
              href={shareLink}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#3b82f6', textDecoration: 'underline' }}
            >
              {shareLink}
            </a>
          </p>
        </div>
        <CopyLinkButton shareLink={shareLink} />
      </div>

      <FlashSaleForm token={token} />
      <FlashSaleList />
    </Layout>
  );
}
