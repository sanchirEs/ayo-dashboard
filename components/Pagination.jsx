"use client";
import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const Pagination = ({ currentPage, totalPages, limit }) => {
  const searchParams = useSearchParams();
  const limitRows = Number(searchParams.get("limit") || 10);
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleClick = (page) => {
    if (typeof page !== "number") return;
    if (page < 1 || page > totalPages || page === currentPage) return;
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSelectLimit = (event) => {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    params.set("limit", event.target.value);
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const pageItems = getPageItems(currentPage, totalPages);

  return (
    <div className="">
      <div className="divider mb-5" />
      <div className="flex items-center justify-between flex-wrap gap10">
        <div className="text-tiny">Showing {limit} entries</div>
        <div className="flex mt-4 gap-3 justify-center items-center flex-wrap">
          <ul className="wg-pagination">
            <li>
              <button
                className={` ${currentPage === 1 ? "btn-disabled" : ""}`}
                onClick={() => handleClick(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <span>«</span>
              </button>
            </li>
            {pageItems.map((item) => {
              if (typeof item === "string") {
                // Ellipsis items have stable unique keys
                return (
                  <li key={item}>
                    <button className="btn-disabled" disabled>
                      ...
                    </button>
                  </li>
                );
              }
              const page = item;
              return (
                <li key={page} className={`${currentPage === page && `active`}`}>
                  <button onClick={() => handleClick(page)}>{page}</button>
                </li>
              );
            })}
            <li>
              <button
                className={` ${
                  currentPage === totalPages ? "btn-disabled" : ""
                }`}
                onClick={() => handleClick(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span>»</span>
              </button>
            </li>
          </ul>

          <div>
            <select
              className="select select-bordered w-full select-sm bg-base-300 max-w-xs"
              onChange={handleSelectLimit}
              defaultValue={limitRows}
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// Returns an array of page items: numbers for actual pages and
// unique string tokens for left/right ellipsis: "ellipsis-left", "ellipsis-right"
const getPageItems = (current, total) => {
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
    return [1];
  }

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items = [];
  items.push(1);

  // Determine main range around current
  let start = Math.max(2, current - 1);
  let end = Math.min(total - 1, current + 1);

  // Widen window near the edges
  if (current <= 4) {
    start = 2;
    end = 5;
  } else if (current >= total - 3) {
    start = total - 4;
    end = total - 1;
  }

  // Left ellipsis
  if (start > 2) items.push("ellipsis-left");

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  // Right ellipsis
  if (end < total - 1) items.push("ellipsis-right");

  items.push(total);
  return items;
};

export default Pagination;
