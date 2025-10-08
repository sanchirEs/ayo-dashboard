import Layout from "@/components/layout/Layout";
import NewCampaignForm from "./NewCampaignForm";

export default function NewCampaign() {
  return (
    <Layout breadcrumbTitleParent="Маркетинг" breadcrumbTitle="Шинэ урамшуулал үүсгэх">
      <div className="wg-box">
        <NewCampaignForm />
      </div>
    </Layout>
  );
}

