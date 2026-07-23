/**
 * E2E Test Suite - Tier 3: Cross-Feature Interactions
 * Tests complex interactions: Combined search+category+sort+contrast, category changes during search, reset behavior, map selection.
 */
import assert from 'node:assert/strict';
import { HubTestDriver } from './harness.js';

export async function runTier3Tests() {
  const tests = [
    {
      name: 'T3.1: Combined Search + Category Filter + Distance Sort + High Contrast Active',
      fn: () => {
        const driver = new HubTestDriver();
        const sfLocation = { lat: 37.7749, lng: -122.4194 };

        driver
          .toggleContrast() // Enable High Contrast
          .setTextSize('large') // Enable Large Text
          .selectCategory('food') // Category = food
          .search('pantry') // Query = pantry
          .setUserLocation(sfLocation)
          .setSortBy('distance'); // Sort by distance

        const results = driver.getVisibleResources();
        const domState = driver.getDOMState();

        // Check DOM accessibility state remains active
        assert.equal(domState['data-contrast'], 'high-contrast', 'High contrast must remain active');
        assert.equal(domState['data-text-size'], 'large', 'Large text size must remain active');

        // Check search & category results
        assert.ok(results.length > 0, 'Should find matching food pantry resources');
        results.forEach(res => {
          assert.equal(res.category, 'food', 'Every result must belong to "food" category');
          assert.ok(
            res.name.toLowerCase().includes('pantry') ||
            res.description.toLowerCase().includes('pantry') ||
            res.tags.some(t => t.toLowerCase().includes('pantry')),
            'Every result must match query "pantry"'
          );
        });

        // Check distance sort order
        if (results.length > 1) {
          const dist0 = Math.hypot(results[0].location.lat - sfLocation.lat, results[0].location.lng - sfLocation.lng);
          const dist1 = Math.hypot(results[1].location.lat - sfLocation.lat, results[1].location.lng - sfLocation.lng);
          assert.ok(dist0 <= dist1 + 0.0001, 'First result must be closer than second result');
        }
      }
    },
    {
      name: 'T3.2: Dynamic Category Change During Search Query',
      fn: () => {
        const driver = new HubTestDriver();

        // Step 1: Search "center" with category = "all"
        driver.search('center').selectCategory('all');
        const resultsAll = driver.getVisibleResources();
        assert.ok(resultsAll.length >= 2, 'Should find multiple results for "center" in all categories');

        // Step 2: Switch category to "shelter" while keeping search query "center"
        driver.selectCategory('shelter');
        const resultsShelter = driver.getVisibleResources();
        assert.ok(resultsShelter.length > 0, 'Should find shelter resources matching "center"');
        resultsShelter.forEach(res => {
          assert.equal(res.category, 'shelter', 'Results must be filtered to "shelter" category');
        });

        // Step 3: Switch category to "health" while keeping query "center"
        driver.selectCategory('health');
        const resultsHealth = driver.getVisibleResources();
        resultsHealth.forEach(res => {
          assert.equal(res.category, 'health', 'Results must be filtered to "health" category');
        });
      }
    },
    {
      name: 'T3.3: Resetting Filters Preserves Accessibility Settings',
      fn: () => {
        const driver = new HubTestDriver();

        // Set accessibility state
        driver.toggleContrast().setTextSize('extra-large');
        assert.equal(driver.getAccessibilityState().contrastMode, 'high-contrast');
        assert.equal(driver.getAccessibilityState().textSize, 'extra-large');

        // Apply filters
        driver.selectCategory('health').search('clinic');
        assert.equal(driver.query, 'clinic');
        assert.equal(driver.category, 'health');

        // Reset filters
        driver.resetFilters();

        // Verify filters reset to defaults
        assert.equal(driver.query, '');
        assert.equal(driver.category, 'all');

        // Verify accessibility state persists!
        assert.equal(driver.getAccessibilityState().contrastMode, 'high-contrast', 'Contrast mode must persist after filter reset');
        assert.equal(driver.getAccessibilityState().textSize, 'extra-large', 'Text size must persist after filter reset');
      }
    },
    {
      name: 'T3.4: Selecting Map Marker After Search & Category Filter Opens Matching Detail Modal',
      fn: () => {
        const driver = new HubTestDriver();

        driver.selectCategory('health').search('free').setViewMode('map');
        const markers = driver.getMapMarkers();
        assert.ok(markers.length > 0, 'Should have map markers for health category search');

        const selectedMarker = markers[0];
        driver.openDetail(selectedMarker.id);

        const modal = driver.getDetailModal();
        assert.ok(modal !== null, 'Detail modal must be open');
        assert.equal(modal.id, selectedMarker.id, 'Modal resource ID must match clicked marker ID');
        assert.equal(modal.category, 'health');
        assert.equal(driver.getDOMState()['data-modal-open'], true);
      }
    }
  ];

  return tests;
}
