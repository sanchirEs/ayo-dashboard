import { getOrders } from "@/lib/api/orders";
import ProductOrdersClient from "./ProductOrdersClient";

/**
 * Aggregates order items by product across all fetched orders.
 * Returns an array of product groups sorted by total qty desc.
 */
function aggregateByProduct(orders) {
    const map = new Map();

    for (const order of orders) {
        if (!Array.isArray(order.orderItems)) continue;

        for (const item of order.orderItems) {
            const productId = item.productId;
            if (!productId) continue;

            const productName = item.product?.name || `Бүтээгдэхүүн #${productId}`;
            const imageUrl = item.product?.ProductImages?.[0]?.imageUrl || null;
            const qty = item.quantity || 0;
            const price = parseFloat(item.price) || 0;
            const variantSku = item.variant?.sku || null;

            if (!map.has(productId)) {
                map.set(productId, {
                    productId,
                    productName,
                    imageUrl,
                    totalQty: 0,
                    totalRevenue: 0,
                    orderCount: 0,
                    variantSkus: new Set(),
                    orders: [],
                    lastOrderedAt: null,
                });
            }

            const group = map.get(productId);
            group.totalQty += qty;
            group.totalRevenue += price * qty;
            group.orderCount += 1;
            if (variantSku) group.variantSkus.add(variantSku);

            const orderDate = new Date(order.createdAt);
            if (!group.lastOrderedAt || orderDate > group.lastOrderedAt) {
                group.lastOrderedAt = orderDate;
            }

            // Attach order reference (deduplicate by order id)
            const existingOrderRef = group.orders.find(o => o.id === order.id);
            if (existingOrderRef) {
                existingOrderRef.qty += qty;
            } else {
                group.orders.push({
                    id: order.id,
                    createdAt: order.createdAt,
                    status: order.status,
                    qty,
                    customerName: order.user
                        ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim()
                        : '—',
                    customerPhone: order.shipping?.recipientPhone || order.user?.telephone || '—',
                    total: order.total,
                });
            }
        }
    }

    // Convert to serializable array
    return Array.from(map.values())
        .map(g => ({
            ...g,
            variantSkus: Array.from(g.variantSkus),
            lastOrderedAt: g.lastOrderedAt ? g.lastOrderedAt.toISOString() : null,
            orders: g.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        }))
        .sort((a, b) => b.totalQty - a.totalQty);
}

/**
 * Aggregates orders by user.
 * Returns array of user groups sorted by totalSpent desc.
 */
function aggregateByUser(orders) {
    const map = new Map();

    for (const order of orders) {
        const userId = order.userId || order.user?.id;
        if (!userId) continue;

        const customerName = order.user
            ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || `Хэрэглэгч #${userId}`
            : `Хэрэглэгч #${userId}`;
        const email = order.user?.email || '—';
        const phone = order.shipping?.recipientPhone || order.user?.telephone || '—';
        const orderTotal = parseFloat(order.total) || 0;
        const orderQty = Array.isArray(order.orderItems)
            ? order.orderItems.reduce((s, i) => s + (i.quantity || 0), 0)
            : 0;

        if (!map.has(userId)) {
            map.set(userId, {
                userId,
                customerName,
                email,
                phone,
                orderCount: 0,
                totalQty: 0,
                totalSpent: 0,
                lastOrderedAt: null,
                orders: [],
            });
        }

        const group = map.get(userId);
        group.orderCount += 1;
        group.totalQty += orderQty;
        group.totalSpent += orderTotal;

        const orderDate = new Date(order.createdAt);
        if (!group.lastOrderedAt || orderDate > group.lastOrderedAt) {
            group.lastOrderedAt = orderDate;
        }

        group.orders.push({
            id: order.id,
            createdAt: order.createdAt,
            status: order.status,
            qty: orderQty,
            total: order.total,
            itemCount: order.orderItems?.length || 0,
        });
    }

    return Array.from(map.values())
        .map(g => ({
            ...g,
            lastOrderedAt: g.lastOrderedAt ? g.lastOrderedAt.toISOString() : null,
            orders: g.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent);
}

export default async function ProductOrdersTable({ searchParams }) {
    const params = searchParams instanceof Promise ? await searchParams : searchParams;

    const status = params?.status || '';
    const dateFrom = params?.dateFrom || '';
    const dateTo = params?.dateTo || '';

    try {
        // Fetch a large batch — group server-side, no new endpoint needed
        const { data: orders } = await getOrders({
            page: 1,
            limit: 500,
            status,
            dateFrom,
            dateTo,
            sortField: 'createdAt',
            sortOrder: 'desc',
        });

        const groups = aggregateByProduct(orders || []);
        const userGroups = aggregateByUser(orders || []);

        // Summary stats
        const totalProducts = groups.length;
        const totalUnits = groups.reduce((s, g) => s + g.totalQty, 0);
        const totalRevenue = groups.reduce((s, g) => s + g.totalRevenue, 0);

        return (
            <ProductOrdersClient
                groups={groups}
                userGroups={userGroups}
                stats={{ totalProducts, totalUnits, totalRevenue }}
            />
        );
    } catch (error) {
        console.error('Error loading product orders:', error);
        return (
            <div className="wg-table table-all-category">
                <div className="text-center py-8" style={{ color: '#ef4444' }}>
                    Алдаа гарлаа: {error.message}
                </div>
            </div>
        );
    }
}
