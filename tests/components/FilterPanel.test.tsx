import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FilterPanel } from '../../src/components/FilterPanel';

const baseProps = {
  selectedCategory: 'all',
  onCategoryChange: () => {},
  sortBy: 'relevance' as const,
  onSortChange: () => {},
  totalResultsCount: 0,
};

describe('FilterPanel result copy', () => {
  it('does not claim zero listings when a national location has not been chosen', () => {
    render(
      <FilterPanel
        {...baseProps}
        awaitingLocation
        resultsContext="from national food, medical, and behavioral-health directories"
      />
    );
    expect(screen.getByText(/enter a zip or use your location to search/i)).toBeInTheDocument();
    expect(screen.queryByText(/showing 0 resources/i)).not.toBeInTheDocument();
  });

  it('reports the result count once a search can run', () => {
    render(
      <FilterPanel
        {...baseProps}
        totalResultsCount={11}
        resultsContext="in the Gainesville, FL area"
      />
    );
    expect(screen.getByText(/showing 11 resources in the gainesville, fl area/i)).toBeInTheDocument();
  });
});
