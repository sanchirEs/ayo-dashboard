"use client";

export default function FilterPanel({
  filters,
  onFiltersChange,
  users,
  excludedNoPhone,
  loading,
  selectedIds,
  onSelectionChange,
}) {
  const allIds = users.map((u) => u.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  function toggleAll() {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allIds));
    }
  }

  function toggleOne(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  }

  function setFilter(key, value) {
    const next = { ...filters, [key]: value };
    if (key === 'neverOrdered' && value) {
      next.hasOrdered = false;
      next.lastOrderedDays = '';
    }
    if ((key === 'hasOrdered' || key === 'lastOrderedDays') && value) {
      next.neverOrdered = false;
    }
    onFiltersChange(next);
  }

  return (
    <div className="wg-box" style={{ flex: 1, minWidth: 0 }}>
      <div className="flex items-center justify-between mb-16">
        <h6 className="mb-0">Шүүлтүүр</h6>
        {loading && <span className="text-secondary" style={{ fontSize: 13 }}>Уншиж байна...</span>}
      </div>

      <div className="flex flex-wrap gap-12 mb-16">
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Төрөл</label>
          <select
            value={filters.role || 'CUSTOMER'}
            onChange={(e) => setFilter('role', e.target.value)}
            style={{ fontSize: 13, padding: '4px 8px' }}
          >
            <option value="ALL">Бүх хэрэглэгч</option>
            <option value="CUSTOMER">Худалдан авагч</option>
            <option value="VENDOR">Борлуулагч</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!filters.hasOrdered}
              disabled={!!filters.neverOrdered}
              onChange={(e) => setFilter('hasOrdered', e.target.checked)}
            />
            Захиалсан
          </label>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Сүүлд захиалсан</label>
          <select
            value={filters.lastOrderedDays || ''}
            disabled={!!filters.neverOrdered}
            onChange={(e) => setFilter('lastOrderedDays', e.target.value)}
            style={{ fontSize: 13, padding: '4px 8px' }}
          >
            <option value="">Бүх хугацаа</option>
            <option value="30">Сүүлийн 30 хоног</option>
            <option value="60">Сүүлийн 60 хоног</option>
            <option value="90">Сүүлийн 90 хоног</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!filters.neverOrdered}
              disabled={!!filters.hasOrdered || !!filters.lastOrderedDays}
              onChange={(e) => setFilter('neverOrdered', e.target.checked)}
            />
            Захиалаагүй
          </label>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Бүртгэлийн огноо ~</label>
          <input
            type="date"
            value={filters.registeredAfter || ''}
            onChange={(e) => setFilter('registeredAfter', e.target.value)}
            style={{ fontSize: 13, padding: '4px 8px' }}
          />
        </div>
      </div>

      {excludedNoPhone > 0 && (
        <div className="mb-12" style={{ fontSize: 13, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '6px 12px' }}>
          ⚠️ {excludedNoPhone} хэрэглэгч утасгүй тул орхигдоно
        </div>
      )}

      <div className="flex items-center justify-between mb-12">
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {selectedIds.size} хэрэглэгч сонгогдсон
        </span>
        <button
          type="button"
          className="tf-button style-1 btn-sm"
          onClick={toggleAll}
          disabled={loading || users.length === 0}
        >
          {allSelected ? 'Бүгдийг болиулах' : 'Бүгдийг сонгох'}
        </button>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
        <table className="table table-striped" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={users.length === 0} />
              </th>
              <th>Нэр</th>
              <th>Утас</th>
              <th>Сүүлд захиалсан</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && !loading && (
              <tr><td colSpan={4} className="text-center text-secondary">Хэрэглэгч олдсонгүй</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => toggleOne(u.id)}>
                <td onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleOne(u.id)} />
                </td>
                <td>{u.firstName || ''} {u.lastName || ''}</td>
                <td>{u.telephone}</td>
                <td style={{ color: u.lastOrderDate ? 'inherit' : '#9ca3af' }}>
                  {u.lastOrderDate ? new Date(u.lastOrderDate).toLocaleDateString('mn-MN') : 'Захиалаагүй'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
