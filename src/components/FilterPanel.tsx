import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface FilterPanelProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  sortBy: 'relevance' | 'name' | 'distance';
  onSortChange: (sort: 'relevance' | 'name' | 'distance') => void;
  totalResultsCount: number;
  distanceAvailable?: boolean;
  availableLanguages?: { code: string; label: string }[];
  selectedLanguage?: string;
  onLanguageChange?: (language: string) => void;
  wheelchairFilterAvailable?: boolean;
  wheelchairOnly?: boolean;
  onWheelchairOnlyChange?: (enabled: boolean) => void;
  resultsContext?: string;
  availableCategoryIds?: string[];
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
  availableLanguages = [],
  selectedLanguage = 'all',
  onLanguageChange,
  wheelchairFilterAvailable = false,
  wheelchairOnly = false,
  onWheelchairOnlyChange,
  resultsContext = 'in the Gainesville, FL area',
  availableCategoryIds,
}) => {
  const hasSupportedAdvancedFilters =
    availableLanguages.length > 0 || wheelchairFilterAvailable;
  const displayedCategories = availableCategoryIds
    ? categories.filter((category) => availableCategoryIds.includes(category.id))
    : categories;

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-5">
      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
        {displayedCategories.map((cat) => {
          const isActive = selectedCategory.toLowerCase() === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              aria-pressed={isActive}
              className={`min-h-11 rounded-full px-4 py-2 font-display text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary text-inverse shadow-sm'
                  // hover:bg-app, NOT hover:bg-border -- in high-contrast --border-main and
                  // --text-main are both #ffffff, so a border-token background made the label
                  // vanish on hover (1:1) exactly in the mode built for low vision.
                  : 'bg-card-hover text-main hover:bg-app'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {hasSupportedAdvancedFilters && (
        <fieldset className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
          <legend className="sr-only">Additional verified filters</legend>
          {availableLanguages.length > 0 && onLanguageChange && (
            <label className="grid gap-1 text-xs font-semibold text-main">
              Service language
              <select
                value={selectedLanguage}
                onChange={(event) => onLanguageChange(event.target.value)}
                className="min-h-11 rounded-lg border border-border-input bg-app px-3 py-2 text-sm text-main"
              >
                <option value="all">Any documented language</option>
                {availableLanguages.map((language) => (
                  <option key={language.code} value={language.code}>{language.label}</option>
                ))}
              </select>
            </label>
          )}
          {wheelchairFilterAvailable && onWheelchairOnlyChange && (
            <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border-input bg-app px-3 py-2 text-sm font-semibold text-main">
              <input
                type="checkbox"
                checked={wheelchairOnly}
                onChange={(event) => onWheelchairOnlyChange(event.target.checked)}
                className="h-4 w-4 accent-[color:var(--color-primary)]"
              />
              Documented wheelchair access
            </label>
          )}
          <p className="w-full text-xs text-muted">
            These filters appear only when the directory source supplies reviewed metadata.
          </p>
        </fieldset>
      )}

      {/* Filter Stats & Sort */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border text-xs text-muted">
        <span className="font-semibold text-main">
          Showing {totalResultsCount} resource{totalResultsCount === 1 ? '' : 's'} {resultsContext}
        </span>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted" aria-hidden="true" />
          <span className="font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'relevance' | 'name' | 'distance')}
            aria-label="Sort resources"
            className="min-h-11 bg-app border border-border text-main rounded-lg px-2.5 py-1.5 text-xs font-semibold"
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
