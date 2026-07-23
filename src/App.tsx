import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import { FilterPanel } from './components/FilterPanel';
import { ResourceCard } from './components/ResourceCard';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { LocationControl } from './components/LocationControl';
import { ResourceMap } from './components/ResourceMap';
import { useGeolocation } from './hooks/useGeolocation';
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

  // When the user sets a location, default the sort to distance (unless they've chosen
  // name); when they clear it, fall back off distance. Never overrides an explicit choice.
  useEffect(() => {
    if (location) setSortBy((s) => (s === 'relevance' ? 'distance' : s));
    else setSortBy((s) => (s === 'distance' ? 'relevance' : s));
  }, [location]);

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
    <Layout>
      <div className="space-y-6">
        {/* Demo disclaimer: sample data, real crisis lines. */}
        <div role="alert" className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-4 py-3 text-sm">
          <strong>Demo directory.</strong> These are real, recently-verified Gainesville, FL resources shown as a
          demonstration, not a guaranteed-current live directory. For real, current help right now, call{' '}
          <a className="font-semibold underline" href="tel:211">211</a> (community services) or{' '}
          <a className="font-semibold underline" href="tel:988">988</a> (crisis &amp; suicide lifeline).
        </div>

        {/* Banner Hero */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Find local support services
            </h2>
            <p className="text-blue-100 text-sm sm:text-base font-normal leading-relaxed">
              Search by category or location to find food pantries, emergency shelters, medical clinics, and legal aid in the Gainesville, FL area.
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Location control (opt-in geolocation / on-device ZIP) */}
        <LocationControl
          location={location}
          status={status}
          error={error}
          onRequestGps={requestGps}
          onSetZip={setFromZip}
          onClear={clear}
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
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1" role="group" aria-label="View mode">
            <button
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                view === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ListIcon className="h-4 w-4" aria-hidden="true" /> List
            </button>
            <button
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                view === 'map' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" /> Map
            </button>
          </div>
        </div>

        {/* Results */}
        {view === 'map' ? (
          <ResourceMap resources={filteredResources} userLocation={location} onSelect={setSelectedResource} />
        ) : filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} onSelect={(res) => setSelectedResource(res)} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No resources found</h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-4">
              No resources match your current search. Try a different keyword or category, or dial 211 for a live referral.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Detail Modal */}
        <ResourceDetailModal resource={selectedResource} onClose={() => setSelectedResource(null)} />
      </div>
    </Layout>
  );
};

export default App;
