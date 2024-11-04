"use client";
import Link from "next/link";
import { useState } from "react";

export default function DataTable({
  columns,
  data,
  actions,
  searchPlaceholder,
  onSearch,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="wg-box">
      {/* Search and Add Button */}
      <div className="flex items-center justify-between gap10 flex-wrap">
        <div className="wg-filter flex-grow">
          <form className="form-search" onSubmit={handleSearch}>
            <fieldset className="name">
              <input
                type="text"
                placeholder={searchPlaceholder || "Search here..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-required="true"
                required
              />
            </fieldset>
            <div className="button-submit">
              <button type="submit">
                <i className="icon-search" />
              </button>
            </div>
          </form>
        </div>
        <Link className="tf-button style-1 w208" href="/add-new-user">
          <i className="icon-plus" />
          Add new
        </Link>
      </div>

      {/* Table Headings */}
      <div className="wg-table table-all-user">
        <ul className="table-title flex gap20 mb-14">
          {columns.map((col) => (
            <li key={col.key}>
              <div className="body-title">{col.label}</div>
            </li>
          ))}
        </ul>

        {/* Table Rows */}
        <ul className="flex flex-column">
          {data.map((item, index) => (
            <li key={index} className="user-item gap14">
              {columns.map((col) => (
                <div key={col.key} className="body-text">
                  {col.render ? col.render(item[col.key]) : item[col.key]}
                </div>
              ))}
              <div className="list-icon-function">
                {actions.map((action) => (
                  <div key={action.label} className={`item ${action.icon}`}>
                    <i
                      className={action.icon}
                      onClick={() => action.onClick(item)}
                    />
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between flex-wrap gap10">
        <div className="text-tiny">Showing 10 entries</div>
        <ul className="wg-pagination">
          <li>
            <Link href="#">
              <i className="icon-chevron-left" />
            </Link>
          </li>
          <li>
            <Link href="#">1</Link>
          </li>
          <li className="active">
            <Link href="#">2</Link>
          </li>
          <li>
            <Link href="#">3</Link>
          </li>
          <li>
            <Link href="#">
              <i className="icon-chevron-right" />
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
