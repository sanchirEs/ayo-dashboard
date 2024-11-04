import Layout from "@/components/layout/Layout";
import DataTable from "./UserTable";
import Link from "next/link";
export default function AllUser() {
  return (
    <>
      <Layout breadcrumbTitleParent="User" breadcrumbTitle="All User">
        <div className="wg-box">
          <div className="flex items-center justify-between gap10 flex-wrap">
            <div className="wg-filter flex-grow">
              <form className="form-search">
                <fieldset className="name">
                  <input
                    type="text"
                    placeholder="Search here..."
                    name="name"
                    tabIndex={2}
                    aria-required="true"
                    required
                  />
                </fieldset>
                <div className="button-submit">
                  <button type="submit">
                    <i className="icon-search" />
                  </button>
                </div>
              </form>
            </div>
            <Link className="tf-button style-1 w208" href="/add-new-user">
              <i className="icon-plus" />
              Add new
            </Link>
          </div>
          <DataTable />
          <div className="divider" />
          <div className="flex items-center justify-between flex-wrap gap10">
            <div className="text-tiny">Showing 10 entries</div>
            <ul className="wg-pagination">
              <li>
                <Link href="#">
                  <i className="icon-chevron-left" />
                </Link>
              </li>
              <li>
                <Link href="#">1</Link>
              </li>
              <li className="active">
                <Link href="#">2</Link>
              </li>
              <li>
                <Link href="#">3</Link>
              </li>
              <li>
                <Link href="#">
                  <i className="icon-chevron-right" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Layout>
    </>
  );
}
