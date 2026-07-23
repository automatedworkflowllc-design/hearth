import React, { useState, useMemo } from 'react';
import Layout from './components/Layout';
import { FilterPanel } from './components/FilterPanel';
import { ResourceCard } from './components/ResourceCard';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { searchResources } from './services/resourceService';
import { mockResources } from './data/resources';
import type { Resource } from './types/index';
import { AlertCircle, MapPin } from 'lucide-react';

export const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'name' | 'distance'>('relevance');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const filteredResources = useMemo(() => {
    return searchResources(
      searchQuery,
      selectedCategory,
      selectedCity,
      [],
      undefined,
      sortBy,
      mockResources
    );
  }, [searchQuery, selectedCategory, selectedCity, sortBy]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Demo disclaimer -- temporary M1 honesty stopgap; verified real data lands in M2. */}
        <div role="alert" className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-4 py-3 text-sm">
          <strong>Demo directory.</strong> These listings are illustrative sample data, not a verified live directory. For real, current help right now, call{' '}
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
              Search by category or location to find food pantries, emergency shelters, medical clinics, and legal aid.
            </p>
          </div>
          {/* Subtle Background Glow */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Search & Filter Controls */}
        <FilterPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalResultsCount={filteredResources.length}
        />

        {/* Resources Grid */}
        {filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onSelect={(res) => setSelectedResource(res)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No resources found</h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-4">
              We couldn't find any resources matching your current search in this location. Try searching for another city, state, or zip code.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedCity('all');
              }}
              className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Detail Modal */}
        <ResourceDetailModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      </div>
    </Layout>
  );
};

export default App;
