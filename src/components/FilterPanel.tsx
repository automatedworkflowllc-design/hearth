import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface FilterPanelProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  sortBy: 'relevance' | 'name' | 'distance';
  onSortChange: (sort: 'relevance' | 'name' | 'distance') => void;
  totalResultsCount: number;
  distanceAvailable?: boolean;
}

// Plain text labels: the emoji that used to prefix these rendered inconsistently across the
// old/low-end phones this audience actually uses (and read as filler rather than iconography).
const categories = [
  { id: 'all', label: 'All' },
  { id: 'food', label: 'Food & meals' },
  { id: 'shelter', label: 'Shelter & housing' },
  { id: 'health', label: 'Medical & health' },
  { id: 'legal', label: 'Legal aid' },
  { id: 'support', label: 'Community support' },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  totalResultsCount,
  distanceAvailable = false,
}) => {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-5">
      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
        {categories.map((cat) => {
          const isActive = selectedCategory.toLowerCase() === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              aria-pressed={isActive}
              className={`rounded-full px-4 py-2 font-display text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary text-inverse shadow-sm'
                  : 'bg-card-hover text-main hover:bg-border'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Filter Stats & Sort */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border text-xs text-muted">
        <span className="font-semibold text-main">
          Showing {totalResultsCount} resource{totalResultsCount === 1 ? '' : 's'} in the Gainesville, FL area
        </span>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted" aria-hidden="true" />
          <span className="font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'relevance' | 'name' | 'distance')}
            aria-label="Sort resources"
            className="bg-app border border-border text-main rounded-lg px-2.5 py-1.5 text-xs font-semibold"
          >
            <option value="relevance">Relevance</option>
            <option value="name">Name (A-Z)</option>
            {distanceAvailable && <option value="distance">Distance (nearest)</option>}
          </select>
        </div>
      </div>
    </div>
  );
};
