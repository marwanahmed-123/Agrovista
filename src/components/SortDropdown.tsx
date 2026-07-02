import { useRef, useState, useEffect } from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";

export interface SortOption<T extends string> {
  value: T;
  label: string;
}

interface SortDropdownProps<T extends string> {
  options: SortOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function SortDropdown<T extends string>({
  options,
  value,
  onChange,
}: SortDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center w-full bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 active:scale-[0.98] transition-all duration-200 px-3 py-2.5 cursor-pointer gap-2"
      >
        <ArrowUpDown size={16} className="text-gray-400 shrink-0" />
        <span className="flex-1 min-w-0 text-sm text-left text-gray-700 font-medium">
          {options.find((o) => o.value === value)?.label || "Sort"}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                value === option.value
                  ? "bg-orange-50 text-orange-600 font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
