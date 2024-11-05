"use client";
import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
const Pagination = ({ currentPage, totalPages, limit }) => {
  const searchParams = useSearchParams();
  const limitRows = Number(searchParams.get("limit") || 10);
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleClick = (page) => {
    const params = new URLSearchParams(searchParams);
    if (page) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSelectLimit = (event) => {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    params.set("limit", event.target.value);
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const Pages = getPageNumbers(currentPage, totalPages);

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
              >
                <span>«</span>
              </button>
            </li>
            {Pages.map((page) => {
              const isDisabled = page === -1;
              return (
                <li
                  key={page}
                  className={`${currentPage === page && `active`}`}
                >
                  <button
                    className={` ${
                      ``
                      //   currentPage === page
                      //     ? "btn-primary"
                      //     : isDisabled
                      //     ? "btn-disabled"
                      //     : "btn"
                    }`}
                    onClick={() => handleClick(page)}
                    disabled={isDisabled}
                  >
                    {isDisabled ? "..." : page}
                  </button>
                </li>
              );
            })}
            <li>
              <button
                className={` ${
                  currentPage === totalPages ? "btn-disabled" : ""
                }`}
                onClick={() => handleClick(currentPage + 1)}
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

const getPageNumbers = (current, total) => {
  const pages = [];
  pages.push(1);
  if (total > 1) pages.push(2);
  if (total > 2) pages.push(3);
  if (total > 3) pages.push(4);

  if (current > 3) {
    pages.push(current - 1); // Page before current
  }

  pages.push(current); // Current page

  if (current < total - 2) {
    pages.push(current + 1); // Page after current
  }

  if (total > 2) pages.push(total - 1);
  if (total > 1) pages.push(total);

  const uniquePages = Array.from(new Set(pages));
  if (current !== 1 && current !== total) {
    if (uniquePages[2] !== 3) uniquePages.splice(2, 0, -1);
  }

  if (uniquePages[uniquePages.length - 3] !== total - 2)
    uniquePages.splice(uniquePages.length - 2, 0, -1);
  if (uniquePages[0] !== 1) {
    uniquePages.shift();
  }
  return uniquePages;
};

export default Pagination;
