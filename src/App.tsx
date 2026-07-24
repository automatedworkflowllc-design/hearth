import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import { FilterPanel } from './components/FilterPanel';
import { ResourceCard } from './components/ResourceCard';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { LocationControl } from './components/LocationControl';
import { ResourceMap } from './components/ResourceMap';
import { useGeolocation } from './hooks/useGeolocation';
import { useAccessibility } from './hooks/useAccessibility';
import { searchResources } from './services/resourceService';
import { mockResources } from './data/resources';
import type { Resource } from './types/index';
import { AlertCircle, List as ListIcon, Map as MapIcon } from 'lucide-react';

type ViewMode = 'list' | 'map';

export const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'name' | 'distance'>('relevance');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [view, setView] = useState<ViewMode>('list');

  const { location, status, error, requestGps, setFromZip, clear } = useGeolocation();
  const a11y = useAccessibility();

  // When the user sets a location, default the sort to distance (unless they've chosen
  // name); when they clear it, fall back off distance. Never overrides an explicit choice.
  useEffect(() => {
    if (location) setSortBy((s) => (s === 'relevance' ? 'distance' : s));
    else setSortBy((s) => (s === 'distance' ? 'relevance' : s));
  }, [location]);

  // Reset the sort synchronously on clear so the sort <select> is never left showing
  // "distance" after its option is removed (avoids a one-commit value/option mismatch).
  const handleClearLocation = () => {
    clear();
    setSortBy((s) => (s === 'distance' ? 'relevance' : s));
  };

  // Stable identity so the modal's focus-trap/scroll-lock effect runs on open/close only,
  // not on every re-render of App (e.g. typing in search).
  const closeModal = useCallback(() => setSelectedResource(null), []);

  const filteredResources = useMemo(() => {
    return searchResources(
      searchQuery,
      selectedCategory,
      'all',
      [],
      location ?? undefined,
      sortBy,
      mockResources
    );
  }, [searchQuery, selectedCategory, sortBy, location]);

  return (
    <Layout accessibility={a11y}>
      <div className="space-y-6">
        {/* Demo disclaimer: sample data, real crisis lines. */}
        <div role="alert" className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-4 py-3 text-sm">
          <strong>Demo directory.</strong> These are real, recently-verified Gainesville, FL resources shown as a
          demonstration, not a guaranteed-current live directory. For real, current help right now, call{' '}
          <a className="font-semibold underline" href="tel:211">211</a> (community services) or{' '}
          <a className="font-semibold underline" href="tel:988">988</a> (crisis &amp; suicide lifeline).
        </div>

        {/* Hero -- solid warm teal (token-driven, flips in high-contrast), ember accent bar. */}
        <div className="bg-nav text-on-nav rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="max-w-2xl">
            <div className="mb-3 h-1 w-10 rounded-full bg-accent" aria-hidden="true"></div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Find local support services
            </h2>
            <p className="text-on-nav/85 text-sm sm:text-base font-normal leading-relaxed">
              Search by category or location to find food pantries, emergency shelters, medical clinics, and legal aid in the Gainesville, FL area.
            </p>
          </div>
        </div>

        {/* Location control (opt-in geolocation / on-device ZIP) */}
        <LocationControl
          location={location}
          status={status}
          error={error}
          onRequestGps={requestGps}
          onSetZip={setFromZip}
          onClear={handleClearLocation}
        />

        {/* Search & Filter Controls */}
        <FilterPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalResultsCount={filteredResources.length}
          distanceAvailable={!!location}
        />

        {/* View toggle */}
        <div className="flex items-center justify-end">
          <div className="inline-flex rounded-lg border border-border bg-surface p-1" role="group" aria-label="View mode">
            <button
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                view === 'list' ? 'bg-primary text-white' : 'text-muted hover:bg-card-hover'
              }`}
            >
              <ListIcon className="h-4 w-4" aria-hidden="true" /> List
            </button>
            <button
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                view === 'map' ? 'bg-primary text-white' : 'text-muted hover:bg-card-hover'
              }`}
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" /> Map
            </button>
          </div>
        </div>

        {/* Results -- empty state wins in BOTH views so the 211 fallback is never lost */}
        {filteredResources.length === 0 ? (
          <div className="bg-surface rounded-2xl p-12 text-center border border-border shadow-sm">
            <AlertCircle className="w-12 h-12 text-muted mx-auto mb-3" />
            <h3 className="text-lg font-bold text-main mb-1">No resources found</h3>
            <p className="text-muted text-sm max-w-md mx-auto mb-4">
              No resources match your current search. Try a different keyword or category, or dial 211 for a live referral.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:bg-primary-hover transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : view === 'map' ? (
          <ResourceMap resources={filteredResources} userLocation={location} onSelect={setSelectedResource} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} onSelect={(res) => setSelectedResource(res)} />
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <ResourceDetailModal resource={selectedResource} onClose={closeModal} />
      </div>
    </Layout>
  );
};

export default App;
