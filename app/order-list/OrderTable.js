import { getOrders } from "@/lib/api/orders";
import OrderTableClient from "./OrderTableClient";

export default async function OrderTable({ searchParams }) {
  // In Next.js 15, searchParams might be a Promise - await if needed
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 100;
  const status = params.status || '';
  const search = params.search || '';
  const dateFrom = params.dateFrom || '';
  const dateTo = params.dateTo || '';
  const paymentStatus = params.paymentStatus || '';
  const paymentProvider = params.paymentProvider || '';

  try {
    const { data: orders, pagination } = await getOrders({
      page,
      limit,
      status,
      search,
      dateFrom,
      dateTo,
      paymentStatus,
      paymentProvider,
      sortField: 'createdAt', // Sort by creation date to show recent orders first
      sortOrder: 'desc'
    });

    return <OrderTableClient orders={orders} pagination={pagination} />;
  } catch (error) {
    console.error('Error loading orders:', error);
    return (
      <div className="wg-table table-all-category">
        <div className="text-center py-8 text-red-500">
          Error loading orders: {error.message}
        </div>
      </div>
    );
  }
}
