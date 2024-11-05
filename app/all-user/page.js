"use server";
import Layout from "@/components/layout/Layout";
import DataTable from "./UserTable";
import Link from "next/link";
import SearchQuery from "@/components/SearchQueryDebounced";
import SearchQueryWithButton from "@/components/SearchQueryWithButton";
import SearchSelectQuery from "@/components/SearchSelectQuery";
export default async function AllUser(props) {
  const searchParams = await props.searchParams;
  return (
    <>
      <Layout
        breadcrumbTitleParent="User"
        breadcrumbTitle="All User"
        pageTitle="Бүх хэрэглэгчид"
      >
        <div className="wg-box">
          <div className="flex items-center justify-between gap10 flex-wrap">
            {/* <SearchQueryWithButton
              query="search"
              placeholder={"Хайх утгаа оруулна уу"}
            /> */}
            <div className="flex gap-2 flex-wrap">
              <SearchQuery
                query="search"
                placeholder={"Хайх утгаа оруулна уу"}
              />
              <SearchSelectQuery
                placeholder="Эрхийн түвшнээр.."
                query="role"
                options={[
                  {
                    value: "CUSTOMER",
                    label: "CUSTOMER",
                  },
                  {
                    value: "VENDOR",
                    label: "VENDOR",
                  },
                  {
                    value: "ADMIN",
                    label: "ADMIN",
                  },
                  {
                    value: "SUPERADMIN",
                    label: "SUPERADMIN",
                  },
                ]}
              />
            </div>
            <Link className="tf-button style-1 w208" href="/add-new-user">
              <i className="icon-plus" />
              Шинэ хэрэглэгч
            </Link>
          </div>
          <DataTable searchParams={searchParams} />
          <div className="divider" />
        </div>
      </Layout>
    </>
  );
}
