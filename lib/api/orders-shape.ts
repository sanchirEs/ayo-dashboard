import { z } from 'zod';

const OrdersApiShapeSchema = z
  .object({
    success: z.boolean().optional(),
    data: z.unknown().optional(),
    pagination: z.unknown().optional(),
    message: z.string().optional(),
  })
  .passthrough();

/**
 * Coerce an unknown API payload into an orders array.
 * This is intentionally defensive because production responses can differ
 * (or be malformed) and the UI must not crash.
 */
export function coerceOrdersArray<T = unknown>(result: unknown): T[] {
  const parsed = OrdersApiShapeSchema.safeParse(result);
  if (!parsed.success) return [];

  const r: any = parsed.data;

  // Common shapes we’ve seen across environments:
  // - { data: Order[] }
  // - { data: { orders: Order[] } }
  // - { orders: Order[] }
  if (Array.isArray(r.data)) return r.data as T[];
  if (Array.isArray(r.orders)) return r.orders as T[];
  if (Array.isArray(r.data?.orders)) return r.data.orders as T[];

  return [];
}

