"use client";

import { HiMagnifyingGlass } from "react-icons/hi2";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useEffect, useState } from "react";

export default function SearchQueryWithButton({ placeholder, query }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Local state to manage the input value
  const [inputValue, setInputValue] = useState(searchParams.get(query) || "");

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (inputValue) {
      params.set(query, inputValue);
      params.set("page", "1");
      console.log(params);
    } else {
      params.delete(query);
      params.delete("page");
    }
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="wg-filter flex-grow">
      <form
        className="form-search"
        onSubmit={(e) => {
          e.preventDefault(); // Prevent default form submission
          handleSearch();
        }}
      >
        <fieldset className="name">
          <input
            type="text"
            placeholder={placeholder}
            name="name"
            tabIndex={2}
            onChange={(e) => setInputValue(e.target.value)} // Update local state
            value={inputValue} // Controlled input value
          />
        </fieldset>
        <div className="button-submit">
          <button type="submit">
            <i className="icon-search" />
          </button>
        </div>
      </form>
    </div>
  );
}
