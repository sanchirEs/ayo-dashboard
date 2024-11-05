"use client";

// import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}
export default function SearchSelectQuery({
  placeholder,
  query,
  options,
  className,
}: {
  placeholder: string;
  query: string;
  options: Option[];
  className?: string;
}) {
  // Change handler function

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentQueryValue = searchParams.get(query);
  const { replace } = useRouter();
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    console.log(event.target.value);
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (event.target.value === placeholder) {
      params.delete(query);
      replace(`${pathname}?${params.toString()}`);
      // console.log("yes");
      return;
    }
    params.set(query, event.target.value);
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  return (
    <div className={cn("rounded-[20px] ", className)}>
      <select
        className="select select-bordered pr-9 dark:bg-[#121212] w-full text-base-content max-w-xs"
        onChange={handleChange}
        defaultValue={currentQueryValue || placeholder}
      >
        <option
          onSelect={() => {
            const params = new URLSearchParams(searchParams);
          }}
        >
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
