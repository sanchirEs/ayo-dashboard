import GetTokenServer from "@/lib/GetTokenServer";
import FlashSaleForm from "./FlashSaleForm";
import FlashSaleList from "./FlashSaleList";

export const metadata = { title: 'Flash Sale Scheduler — Dashboard' };

export default async function FlashSalePage() {
  const token = await GetTokenServer();
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || '';
  const shareLink = `${frontendUrl}/flashsale`;

  return (
    <div className="main-content-wrap">
      <div className="flex items-center justify-between gap10 flex-wrap mb-20">
        <div>
          <h3 className="text-title">⚡ Flash Sale</h3>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 13 }}>
            Хуваалцах линк:{' '}
            <a
              href={shareLink}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#3b82f6', textDecoration: 'underline' }}
            >
              {shareLink}
            </a>
          </p>
        </div>
        <button
          id="flash-copy-btn"
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            background: 'white',
            cursor: 'pointer',
            fontSize: 13,
            color: '#374151'
          }}
        >
          📋 Линк хуулах
        </button>
      </div>

      <FlashSaleForm token={token} />
      <FlashSaleList />

      {/* Inline copy-to-clipboard — avoids a dedicated Client Component wrapper */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.getElementById('flash-copy-btn')?.addEventListener('click', function() {
            navigator.clipboard.writeText(${JSON.stringify(shareLink)}).then(function() {
              var btn = document.getElementById('flash-copy-btn');
              btn.textContent = '✓ Хуулагдлаа!';
              btn.style.color = '#10b981';
              setTimeout(function() {
                btn.textContent = '📋 Линк хуулах';
                btn.style.color = '#374151';
              }, 2000);
            });
          });
        `
      }} />
    </div>
  );
}
