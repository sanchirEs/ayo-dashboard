import Layout from "@/components/layout/Layout";
import PaymentIssuesClient from "./PaymentIssuesClient";

export default function PaymentIssuesPage() {
  return (
    <Layout breadcrumbTitleParent="Захиалга" breadcrumbTitle="Төлбөрийн зөрүү">
      <PaymentIssuesClient />
    </Layout>
  );
}
