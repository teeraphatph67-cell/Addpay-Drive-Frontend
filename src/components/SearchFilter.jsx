import { FiSearch, FiCalendar, FiX } from "react-icons/fi";
import { BASE_URL } from "../api/api.js";

const SearchFilter = ({
  search = "",
  setSearch = () => {},

  dateFrom = "",
  setDateFrom = () => {},

  dateTo = "",
  setDateTo = () => {},

  suggestions = [],
  showDropdown = false,
  onSelectSuggestion = () => {},
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between relative">
      
      {/* 🔍 Search */}
      <div className="relative w-full md:max-w-sm">
        <FiSearch className="absolute left-4 top-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหาไฟล์หรือโฟลเดอร์..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 
                     focus:outline-none focus:ring-2 focus:ring-blue-500/30
                     text-sm text-gray-700"
        />

        {/* 🔽 Dropdown */}
        {/* {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-lg border overflow-hidden">
            {suggestions.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectSuggestion(item)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
              >
                {item.avatar_url ? (
                  <img
                    src={`${BASE_URL}${item.avatar_url}`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                    👤
                  </div>
                )}

                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">
                    {item.name || item.username}
                  </span>
                  {item.email && (
                    <span className="text-xs text-gray-500">
                      {item.email}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )} */}
      </div>

      {/* 📅 Date filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="pl-10 pr-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
        </div>

        {/* <span className="text-gray-400 text-sm">ถึง</span>

        <div className="relative">
          <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="pl-10 pr-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
        </div> */}

        {(search || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setSearch("");
              setDateFrom("");
              setDateTo("");
            }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500"
          >
            <FiX />
            ล้างตัวกรอง
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;
