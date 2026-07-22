import GetTokenServer from "@/lib/GetTokenServer";
import { getFlashSaleSchedule } from "@/lib/api/flashSale";
import { getFlashSaleStatus } from "@/lib/flashSaleStatus";
import { formatUB } from "@/lib/ubTime";
import FlashSaleForm from "./FlashSaleForm";

export default async function FlashSaleList() {
  const token = await GetTokenServer();
  const schedule = await getFlashSaleSchedule(token).catch(() => ({
    items: [],
    total: 0,
    pages: 0,
    page: 1,
    limit: 20
  }));

  if (schedule.items.length === 0) {
    return (
      <div className="wg-box mt-20">
        <h4 className="text-title mb-20">Scheduled Flash Sales</h4>
        <p style={{ color: '#6b7280' }}>Flash sale байхгүй байна. Дээрх формоор шинэ flash sale үүсгэнэ үү.</p>
      </div>
    );
  }

  return (
    <div className="wg-box mt-20">
      <div className="flex items-center justify-between mb-20">
        <h4 className="text-title">Scheduled Flash Sales</h4>
        <span style={{ color: '#6b7280', fontSize: 13 }}>
          Улаанбаатарын цагаар · {schedule.total} нийт
        </span>
      </div>

      <div className="wg-table">
        <ul className="table-title flex gap20 mb-14" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
          <li style={{ flex: 3 }}><div className="body-title">Бараа</div></li>
          <li style={{ flex: 2 }}><div className="body-title">Эхлэх</div></li>
          <li style={{ flex: 2 }}><div className="body-title">Дуусах</div></li>
          <li style={{ flex: 1 }}><div className="body-title">Хямдрал</div></li>
          <li style={{ flex: 1 }}><div className="body-title">Төлөв</div></li>
          <li style={{ flex: 1 }}><div className="body-title">Үйлдэл</div></li>
        </ul>

        <ul className="flex flex-column">
          {schedule.items.map(item => {
            const { label, color, bg, cancellable } = getFlashSaleStatus(item);
            const product = item.products[0]?.product;

            return (
              <li
                key={item.id}
                className="flex gap20 items-center"
                style={{ padding: '12px 0', borderBottom: '1px solid #f8fafc' }}
              >
                <div style={{ flex: 3 }}>
                  <div className="body-title-2" style={{ fontSize: 14 }}>
                    {product?.name || '—'}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>
                    {product?.category?.name || ''}
                  </div>
                </div>

                <div style={{ flex: 2 }}>
                  <div className="body-text" style={{ fontSize: 13 }}>{formatUB(item.startDate)}</div>
                </div>

                <div style={{ flex: 2 }}>
                  <div className="body-text" style={{ fontSize: 13 }}>{formatUB(item.endDate)}</div>
                </div>

                <div style={{ flex: 1 }}>
                  <div className="body-text" style={{ fontWeight: 600 }}>
                    {Number(item.flashSaleDiscountPct)}%
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    color,
                    backgroundColor: bg,
                    whiteSpace: 'nowrap'
                  }}>
                    {label}
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  {cancellable && (
                    <FlashSaleForm mode="cancel" campaignId={item.id} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
