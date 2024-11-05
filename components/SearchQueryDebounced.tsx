"use client";

import { HiMagnifyingGlass } from "react-icons/hi2";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useEffect } from "react";

export default function SearchQueryDebounced({ placeholder, query }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set(query, term);
      params.set("page", "1");
      console.log(params);
    } else {
      params.delete(query);
      params.delete("page");
    }
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, 300);

  return (
    <div className="wg-filter w-[25rem] sm:w-[35rem] md:w-[45rem]">
      <form className="form-search">
        <fieldset className="name">
          <input
            type="text"
            placeholder={placeholder}
            name="name"
            tabIndex={2}
            onChange={(e) => {
              handleSearch(e.target.value);
            }}
            defaultValue={searchParams.get(query)?.toString()}
          />
        </fieldset>
        <div className="button-submit">
          <button type="button">
            <i className="icon-search" />
          </button>
        </div>
      </form>
    </div>
  );
}
