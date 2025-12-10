import { getDeliveries } from "@/lib/api/deliveries";
import DeliveryTableClient from "./DeliveryTableClient";

export default async function DeliveryTable({ searchParams }) {
  // In Next.js 15, searchParams might be a Promise - await if needed
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 100;
  const status = params.status || '';
  const search = params.search || '';
  const dateFrom = params.dateFrom || '';
  const dateTo = params.dateTo || '';

  try {
    const { data: deliveries, pagination } = await getDeliveries({
      page,
      limit,
      status,
      search,
      dateFrom,
      dateTo,
      sortField: 'createdAt', // Sort by creation date to show recent deliveries first
      sortOrder: 'desc'
    });

    return <DeliveryTableClient deliveries={deliveries} pagination={pagination} />;
  } catch (error) {
    console.error('Error loading deliveries:', error);
    return (
      <div className="wg-table table-all-category">
        <div className="text-center py-8 text-red-500">
          Error loading deliveries: {error.message}
        </div>
      </div>
    );
  }
}

