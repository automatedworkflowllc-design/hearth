import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

interface FilterPanelProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  sortBy: 'relevance' | 'name' | 'distance';
  onSortChange: (sort: 'relevance' | 'name' | 'distance') => void;
  totalResultsCount: number;
}

const categories = [
  { id: 'all', label: 'All Categories' },
  { id: 'food', label: '🍎 Food & Meals' },
  { id: 'shelter', label: '🏠 Shelter & Housing' },
  { id: 'health', label: '🏥 Medical & Health' },
  { id: 'legal', label: '⚖️ Legal Aid' },
  { id: 'support', label: '🤝 Community Support' },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  totalResultsCount,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
      {/* Search Bar */}
      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, service, or keyword (e.g. food, shelter, legal)..."
            aria-label="Search resources"
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {categories.map((cat) => {
          const isActive = selectedCategory.toLowerCase() === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Filter Stats & Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
        <span className="font-semibold text-slate-900">
          Showing {totalResultsCount} resource{totalResultsCount === 1 ? '' : 's'} in the Gainesville, FL area
        </span>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'relevance' | 'name' | 'distance')}
            aria-label="Sort resources"
            className="bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="relevance">Relevance</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
