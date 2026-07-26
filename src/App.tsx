import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import { Hero, SEARCH_INPUT_ID } from './components/Hero';
import { SafetyBar } from './components/SafetyBar';
import { FilterPanel } from './components/FilterPanel';
import { ResourceCard } from './components/ResourceCard';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { LocationControl } from './components/LocationControl';
import { ResourceMap } from './components/ResourceMap';
import { useGeolocation } from './hooks/useGeolocation';
import { useAccessibility } from './hooks/useAccessibility';
import { useResources } from './hooks/useResources';
import { getConfiguredProvider } from './providers/resourceProvider';
import type { Resource } from './types/index';
import { AlertCircle, List as ListIcon, Map as MapIcon } from 'lucide-react';

type ViewMode = 'list' | 'map';
const RESULTS_HEADING_ID = 'resource-results';
const RESOURCE_PROVIDER = getConfiguredProvider();
const IS_NATIONAL_DIRECTORY = RESOURCE_PROVIDER.coverage === 'national';

export const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedNeed, setSelectedNeed] = useState<
    | 'all'
    | 'food'
    | 'food-assistance'
    | 'summer-meals'
    | 'medical-care'
    | 'mental-health'
    | 'substance-use'
    | 'detox'
  >('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'name' | 'distance'>('relevance');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [wheelchairOnly, setWheelchairOnly] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [view, setView] = useState<ViewMode>('list');

  const { location, status, error, requestGps, setFromZip, setFromPostalCode, clear } = useGeolocation();
  const a11y = useAccessibility();

  // Set the default distance sort in the same user action that starts location
  // selection. React batches these updates, so the national provider never
  // receives a throwaway relevance request before the distance request.
  const prepareDistanceSort = useCallback(() => {
    setSortBy((current) => (current === 'relevance' ? 'distance' : current));
  }, []);
  const handleRequestGps = useCallback(() => {
    prepareDistanceSort();
    requestGps();
  }, [prepareDistanceSort, requestGps]);
  const handleSetFromZip = useCallback((coords: { lat: number; lng: number }, zip: string) => {
    prepareDistanceSort();
    setFromZip(coords, zip);
  }, [prepareDistanceSort, setFromZip]);
  const handleSetFromPostalCode = useCallback((zip: string) => {
    prepareDistanceSort();
    setFromPostalCode(zip);
  }, [prepareDistanceSort, setFromPostalCode]);

  const resourceRequest = useMemo(() => ({
    query: searchQuery,
    category: IS_NATIONAL_DIRECTORY ? 'all' : selectedCategory,
    need: IS_NATIONAL_DIRECTORY ? selectedNeed : undefined,
    userLocation: location ?? undefined,
    sortBy,
    language: selectedLanguage,
    wheelchairAccessibleOnly: wheelchairOnly,
    limit: 50,
  }), [
    searchQuery,
    selectedCategory,
    selectedNeed,
    location,
    sortBy,
    selectedLanguage,
    wheelchairOnly,
  ]);
  const shouldSearchResources = RESOURCE_PROVIDER.coverage !== 'national' || Boolean(location);
  const {
    resources,
    total,
    facets,
    status: dataStatus,
    error: dataError,
    coverage,
    providerLabel,
  } = useResources(RESOURCE_PROVIDER, resourceRequest, shouldSearchResources);
  const needsNationalLocation = coverage === 'national' && !location;

  // If GPS selection fails, restore a valid non-distance sort while the
  // distance option is unavailable.
  useEffect(() => {
    if (!location && status !== 'idle' && status !== 'locating') {
      setSortBy((current) => (current === 'distance' ? 'relevance' : current));
    }
  }, [location, status]);

  // Reset the sort synchronously on clear so the sort <select> is never left showing
  // "distance" after its option is removed (avoids a one-commit value/option mismatch).
  const handleClearLocation = () => {
    clear();
    setSortBy((s) => (s === 'distance' ? 'relevance' : s));
  };

  // Stable identity so the modal's focus-trap/scroll-lock effect runs on open/close only,
  // not on every re-render of App (e.g. typing in search).
  const closeModal = useCallback(() => setSelectedResource(null), []);

  // The navbar's "Search Resources" button was inert -- App never passed a handler, so clicking
  // it did nothing. It now moves focus to the hero's search field.
  const focusSearch = useCallback(() => {
    const el = document.getElementById(SEARCH_INPUT_ID) as HTMLInputElement | null;
    if (!el) return;
    // Focus FIRST: it is the behavior that matters, and scrollIntoView is not universally
    // available -- calling it first meant one throw silently swallowed the focus entirely.
    el.focus();
    el.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, []);

  const focusResults = useCallback(() => {
    const heading = document.getElementById(RESULTS_HEADING_ID);
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  }, []);

  const showCategory = useCallback((category: string) => {
    setSearchQuery('');
    if (IS_NATIONAL_DIRECTORY) {
      setSelectedNeed(
        category as
          | 'all'
          | 'food'
          | 'food-assistance'
          | 'summer-meals'
          | 'medical-care'
          | 'mental-health'
          | 'substance-use'
          | 'detox'
      );
    } else {
      setSelectedCategory(category);
    }
    setView('list');
    requestAnimationFrame(() => {
      focusResults();
    });
  }, [focusResults]);

  const filteredResources = resources;

  return (
    <Layout accessibility={a11y} onSearchClick={focusSearch}>
      <div className="space-y-6">
        {/* Crisis lines first: correctly scoped (911 danger / 988 talk / DV hotline), calm not alarming. */}
        <SafetyBar />

        {/* Hero owns the page's single <h1> and the real search input. */}
        <Hero
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={focusResults}
          onCategorySelect={showCategory}
          nationalDirectory={IS_NATIONAL_DIRECTORY}
        />

        {coverage === 'local-demo' ? (
          <div role="alert" className="bg-card-hover border-l-4 border-accent text-main rounded-xl px-4 py-3 text-sm">
            <strong>Local demonstration directory.</strong> These are real, recently-reviewed Gainesville, FL
            resources shown while the national data connection is being completed. The interface is national-ready,
            but this build must not imply coverage it does not yet have. For current help, call{' '}
            <a className="font-semibold underline" href="tel:211">211</a> (community services) or{' '}
            <a className="font-semibold underline" href="tel:988">988</a> (crisis &amp; suicide lifeline).
          </div>
        ) : (
          <div role="status" className="bg-card-hover border-l-4 border-accent text-main rounded-xl px-4 py-3 text-sm">
            Searching <strong>{providerLabel}</strong> across food pantries, community meals,
            free summer meals for kids, medical care, and behavioral-health services. Use the
            need filters for cleaner results. For
            shelter, housing, legal help, or another category not yet covered nationally, dial{' '}
            <a className="font-semibold underline" href="tel:211">211</a>.
          </div>
        )}

        {/* Location control (opt-in geolocation / on-device ZIP) */}
        <LocationControl
          location={location}
          status={status}
          error={error}
          onRequestGps={handleRequestGps}
          onSetZip={handleSetFromZip}
          onSetPostalCode={handleSetFromPostalCode}
          nationalCoverage={coverage === 'national'}
          onClear={handleClearLocation}
        />

        {/* Category + sort controls (search itself lives in the Hero). */}
        <FilterPanel
          selectedCategory={IS_NATIONAL_DIRECTORY ? selectedNeed : selectedCategory}
          onCategoryChange={
            IS_NATIONAL_DIRECTORY
              ? (need) =>
                  setSelectedNeed(
                    need as
                      | 'all'
                      | 'food'
                      | 'food-assistance'
                      | 'summer-meals'
                      | 'medical-care'
                      | 'mental-health'
                      | 'substance-use'
                      | 'detox'
                  )
              : setSelectedCategory
          }
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalResultsCount={needsNationalLocation ? 0 : total}
          distanceAvailable={!!location}
          availableLanguages={facets.languages}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          wheelchairFilterAvailable={facets.hasWheelchairData}
          wheelchairOnly={wheelchairOnly}
          onWheelchairOnlyChange={setWheelchairOnly}
          resultsContext={
            coverage === 'national'
              ? 'from national food, medical, and behavioral-health directories'
              : 'in the Gainesville, FL area'
          }
          availableCategoryIds={
            coverage === 'national'
              ? [
                  'all',
                  'food-assistance',
                  'summer-meals',
                  'medical-care',
                  'mental-health',
                  'substance-use',
                  'detox',
                ]
              : ['all', 'food', 'shelter', 'health', 'legal', 'support']
          }
        />

        {/* Results heading -- also keeps the document outline sequential (h1 hero -> h2 here ->
            h3 per card); without it the card headings jumped straight from h1 to h3. */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2
            id={RESULTS_HEADING_ID}
            tabIndex={-1}
            className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-main focus:outline-none"
          >
            Help near you
          </h2>
          <div className="inline-flex rounded-xl border border-border bg-surface p-1" role="group" aria-label="View mode">
            <button
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-bold transition ${
                view === 'list' ? 'bg-primary text-inverse' : 'text-muted hover:bg-card-hover'
              }`}
            >
              <ListIcon className="h-4 w-4" aria-hidden="true" /> List
            </button>
            <button
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-bold transition ${
                view === 'map' ? 'bg-primary text-inverse' : 'text-muted hover:bg-card-hover'
              }`}
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" /> Map
            </button>
          </div>
        </div>

        {/* Results -- loading/error (from the ResourceProvider async boundary) first, then the
            empty state, which wins in BOTH views so the 211 fallback is never lost. */}
        {dataStatus === 'loading' ? (
          <div className="bg-surface rounded-2xl p-12 text-center border border-border shadow-sm">
            <p className="text-muted text-sm" role="status">Loading resources…</p>
          </div>
        ) : dataStatus === 'error' ? (
          <div role="alert" className="bg-surface rounded-2xl p-12 text-center border border-border shadow-sm">
            <h2 className="font-display text-lg font-bold text-main mb-1">Couldn't load the directory</h2>
            <p className="text-muted text-sm max-w-md mx-auto">
              {dataError} Please dial{' '}
              <a className="text-primary font-semibold underline" href="tel:211">211</a> for a live referral.
            </p>
          </div>
        ) : needsNationalLocation ? (
          <div className="bg-surface rounded-2xl p-12 text-center border border-border shadow-sm">
            <MapIcon className="w-12 h-12 text-muted mx-auto mb-3" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-main mb-1">Choose a location</h2>
            <p className="text-muted text-sm max-w-md mx-auto">
              Enter a ZIP code or opt into your device location to find nearby services.
              Your search location is not stored by Hearth.
            </p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="bg-surface rounded-2xl p-12 text-center border border-border shadow-sm">
            <AlertCircle className="w-12 h-12 text-muted mx-auto mb-3" />
            <h2 className="font-display text-lg font-bold text-main mb-1">No resources found</h2>
            <p className="text-muted text-sm max-w-md mx-auto mb-4">
              No resources match your current search. Try a different keyword or category, or dial 211 for a live referral.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedNeed('all');
              }}
              className="min-h-11 px-4 py-2.5 bg-primary text-inverse font-display font-bold text-xs rounded-xl hover:bg-primary-hover transition-colors"
            >
              Reset filters
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

        {/* Closing hope/community note -- the brand's voice, and honest about what is free:
            Hearth itself, not every third-party organization's pricing. */}
        <section className="rounded-2xl bg-card-hover px-6 py-8 sm:px-8">
          <p className="font-serif text-xl italic leading-snug text-main sm:text-2xl max-w-2xl">
            Asking for help is how a community takes care of its own.
          </p>
          <p className="mt-3 text-sm text-muted max-w-2xl">
            Always free to search · no account · no tracking. Each listing shows when it was last
            reviewed.
          </p>
        </section>

        {/* Detail Modal */}
        <ResourceDetailModal resource={selectedResource} onClose={closeModal} />
      </div>
    </Layout>
  );
};

export default App;
