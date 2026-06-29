import Layout from "@/components/layout/Layout";
import AddUserForm from "./AddUserForm";

export const metadata = { title: "Шинэ хэрэглэгч — Ayo Dashboard" };

export default function AddNewUserPage() {
  return (
    <Layout breadcrumbTitleParent="Хэрэглэгч" breadcrumbTitle="Шинэ хэрэглэгч нэмэх">
      <AddUserForm />
    </Layout>
  );
}
