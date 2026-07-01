import getToken from "@/lib/GetTokenServer";
import { getTabList, getTabRows } from "@/lib/api/sheetPayments";
import SheetTableClient from "./SheetTableClient";
import SheetLogPanel from "./SheetLogPanel";
import TabBar from "./TabBar";

const DEFAULT_TAB = "zaya-2026-02-02";

export default async function SheetTable({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const q = params?.q || "";
  const page = parseInt(params?.page) || 1;
  const tabId = params?.tab || DEFAULT_TAB;

  const token = await getToken();

  try {
    const [tabListData, data] = await Promise.all([
      getTabList(token),
      getTabRows(tabId, { q, page, limit: 50 }, token),
    ]);

    const tabs = tabListData.tabs;
    const activeTab = tabs.find((t) => t.tabId === tabId) || tabs[0];

    return (
      <>
        <TabBar tabs={tabs} activeTabId={activeTab.tabId} />
        <SheetTableClient
          initialData={data}
          initialToken={token}
          tabId={activeTab.tabId}
          tabType={activeTab.type}
        />
        <SheetLogPanel initialToken={token} />
      </>
    );
  } catch (error) {
    return (
      <div className="wg-table table-all-category">
        <div className="text-center py-8" style={{ color: "#ef4444" }}>
          Өгөгдөл ачаалахад алдаа гарлаа: {error.message}
        </div>
      </div>
    );
  }
}
