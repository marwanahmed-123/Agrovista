import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  id = "search",
}: SearchInputProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center flex-1 sm:flex-initial bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 focus-within:shadow-md active:scale-[0.98] transition-all duration-200 px-3 py-2.5 cursor-text gap-2"
    >
      <Search size={16} className="text-gray-400 shrink-0" />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-700"
        style={{
          border: "none",
          borderRadius: 0,
          padding: 0,
          boxShadow: "none",
        }}
      />
      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onChange("");
          }}
          className="text-gray-400 hover:text-gray-600 shrink-0 p-0.5 rounded hover:bg-gray-100 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </label>
  );
}
