// ============================================
// SEARCH BAR COMPONENT
// ============================================
// Reusable search bar with icon
// Used for filtering data
// ============================================

export default function SearchBar({
  placeholder = "Search...",
  value = "",
  onChange = () => {},
  className = ""
}) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="relative w-full">
        <input
          type="text"
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
}
