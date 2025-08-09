import Layout from "@/components/layout/Layout";
import NewCouponForm from "./NewCouponForm";

export default function NewCoupon() {
  return (
    <>
      <Layout breadcrumbTitleParent="Marketing" breadcrumbTitle="New Coupon">
        <div className="wg-box">
          <NewCouponForm />
        </div>
      </Layout>
    </>
  );
}
