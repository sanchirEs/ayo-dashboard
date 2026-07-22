export const dynamic = "force-dynamic";

import Layout from "@/components/layout/Layout";
import GetTokenServer from "@/lib/GetTokenServer";
import SaleForm from "./SaleForm";
import SaleList from "./SaleList";

export const metadata = { title: 'Хямдрал — Dashboard' };

export default async function DiscountsPage() {
  const token = await GetTokenServer();

  return (
    <Layout breadcrumbTitleParent="Маркетинг" breadcrumbTitle="Хямдрал">
      <div className="mb-20">
        <h3 className="text-title">🏷️ Хямдрал</h3>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 13 }}>
          Бараа сонгоод хямдрал тохируулна. Дэлгүүр дээр шууд харагдана.
        </p>
      </div>

      <SaleForm token={token} />
      <SaleList token={token} />
    </Layout>
  );
}
