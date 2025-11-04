"use client";

import QuickViewAction from "./QuickViewAction";

export default function OrderRowActions({ order }) {
  return (
    <div className="list-icon-function">
      {/* Only Quick View */}
      <QuickViewAction order={order} />
    </div>
  );
}
