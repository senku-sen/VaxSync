// ============================================
// PAGINATION COMPONENT
// ============================================
// Reusable pagination control for tables
// Shows page navigation and rows per page selector
// ============================================

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  rowsPerPage = 10,
  onPageChange = () => {},
  onRowsPerPageChange = () => {},
  isLoading = false
}) {
  const startRecord = (currentPage - 1) * rowsPerPage + 1;
  const endRecord = Math.min(currentPage * rowsPerPage, totalRecords);

  const rowsPerPageOptions = [10, 25, 50, 100];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
      {/* Left: Records Info */}
      <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
        {totalRecords > 0 ? (
          <>
            Showing <span className="font-semibold">{startRecord}</span> to{" "}
            <span className="font-semibold">{endRecord}</span> of{" "}
            <span className="font-semibold">{totalRecords}</span> records
          </>
        ) : (
          <span>No records to display</span>
        )}
      </div>

      {/* Center: Page Navigation */}
      <div className="flex items-center gap-2 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1 px-2">
          <span className="text-xs sm:text-sm font-medium text-gray-700">
            Page
          </span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value) || 1;
              if (page >= 1 && page <= totalPages) {
                onPageChange(page);
              }
            }}
            disabled={isLoading}
            className="w-12 px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-[#4A7C59] disabled:bg-gray-100"
          />
          <span className="text-xs sm:text-sm font-medium text-gray-700">
            of {totalPages}
          </span>
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Right: Rows Per Page */}
      <div className="flex items-center gap-2 order-3">
        <label htmlFor="rows-per-page" className="text-xs sm:text-sm text-gray-600 font-medium">
          Rows per page:
        </label>
        <select
          id="rows-per-page"
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(parseInt(e.target.value))}
          disabled={isLoading}
          className="px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#4A7C59] disabled:bg-gray-100 bg-white"
        >
          {rowsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
