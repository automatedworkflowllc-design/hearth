/**
 * E2E Test Suite - Tier 1: Feature Coverage
 * Tests core capabilities: Search, Category filters, Distance sorting, Map view, Detail view, Accessibility controls.
 */
import assert from 'node:assert/strict';
import { HubTestDriver } from './harness.js';
import { calculateDistance } from '../../src/services/resourceService.ts';

export async function runTier1Tests() {
  const tests = [
    {
      name: 'T1.1: Keyword Search - filters resources by search string in title, description, or tags',
      fn: () => {
        const driver = new HubTestDriver();
        driver.search('pantry');
        const results = driver.getVisibleResources();
        assert.ok(results.length > 0, 'Expected to find resources matching "pantry"');
        results.forEach(res => {
          const match =
            res.name.toLowerCase().includes('pantry') ||
            res.description.toLowerCase().includes('pantry') ||
            res.tags.some(t => t.toLowerCase().includes('pantry'));
          assert.ok(match, `Resource ${res.id} should contain "pantry" in name, description, or tags`);
        });
      }
    },
    {
      name: 'T1.2: Category Filtering - filters resources strictly by category (food, shelter, health, legal)',
      fn: () => {
        const driver = new HubTestDriver();
        const categories = ['food', 'shelter', 'health', 'legal'];

        categories.forEach(cat => {
          driver.selectCategory(cat);
          const results = driver.getVisibleResources();
          assert.ok(results.length > 0, `Expected at least one resource in category "${cat}"`);
          results.forEach(res => {
            assert.equal(res.category, cat, `Resource category must be "${cat}"`);
          });
        });
      }
    },
    {
      name: 'T1.3: Distance Sorting - sorts resources by ascending geographical distance from user location',
      fn: () => {
        const driver = new HubTestDriver();
        const sfDowntown = { lat: 37.7749, lng: -122.4194 };
        driver.setUserLocation(sfDowntown).setSortBy('distance');

        const results = driver.getVisibleResources();
        assert.ok(results.length >= 2, 'Need at least 2 resources to verify sort order');

        for (let i = 0; i < results.length - 1; i++) {
          const resA = results[i];
          const resB = results[i + 1];

          const distA = calculateDistance(sfDowntown.lat, sfDowntown.lng, resA.location.lat, resA.location.lng);
          const distB = calculateDistance(sfDowntown.lat, sfDowntown.lng, resB.location.lat, resB.location.lng);

          assert.ok(distA <= distB + 0.0001, `Resource at index ${i} (${resA.name}: ${distA}mi) should be closer or equal distance to index ${i+1} (${resB.name}: ${distB}mi)`);
        }
      }
    },
    {
      name: 'T1.4: Map View & Markers - map markers reflect active filtered resources',
      fn: () => {
        const driver = new HubTestDriver();
        driver.selectCategory('shelter').setViewMode('map');

        const visible = driver.getVisibleResources();
        const markers = driver.getMapMarkers();

        assert.equal(markers.length, visible.length, 'Map markers count must match visible resources count');
        assert.equal(driver.getDOMState()['data-view-mode'], 'map', 'View mode must reflect "map"');
        markers.forEach((marker, idx) => {
          assert.equal(marker.id, visible[idx].id, `Marker ${idx} ID must match resource ID`);
          assert.equal(marker.category, 'shelter', 'Marker category must match active filter');
        });
      }
    },
    {
      name: 'T1.5: Detail View Modal - inspects full resource details (hours, contact, address, availability)',
      fn: () => {
        const driver = new HubTestDriver();
        const targetId = 'res-1';
        driver.openDetail(targetId);

        const modal = driver.getDetailModal();
        assert.ok(modal !== null, 'Detail modal should be open');
        assert.equal(modal.id, targetId);
        assert.equal(modal.name, 'Downtown Community Food Pantry');
        assert.ok(modal.hours.length > 0, 'Resource should have hours of operation');
        assert.ok(modal.phone.length > 0, 'Resource should have phone contact');
        assert.ok(modal.address.length > 0, 'Resource should have address');

        driver.closeDetail();
        assert.equal(driver.getDetailModal(), null, 'Modal should be closed after closeDetail()');
      }
    },
    {
      name: 'T1.6: Accessibility Contrast Mode - toggles contrast between standard and high-contrast',
      fn: () => {
        const driver = new HubTestDriver();
        assert.equal(driver.getAccessibilityState().contrastMode, 'standard');
        assert.equal(driver.getDOMState()['data-contrast'], 'standard');

        driver.toggleContrast();
        assert.equal(driver.getAccessibilityState().contrastMode, 'high-contrast');
        assert.equal(driver.getDOMState()['data-contrast'], 'high-contrast');

        driver.toggleContrast();
        assert.equal(driver.getAccessibilityState().contrastMode, 'standard');
        assert.equal(driver.getDOMState()['data-contrast'], 'standard');
      }
    },
    {
      name: 'T1.7: Accessibility Text Size - sets text size to normal, large, and extra-large',
      fn: () => {
        const driver = new HubTestDriver();
        assert.equal(driver.getAccessibilityState().textSize, 'normal');

        driver.setTextSize('large');
        assert.equal(driver.getAccessibilityState().textSize, 'large');
        assert.equal(driver.getDOMState()['data-text-size'], 'large');

        driver.setTextSize('extra-large');
        assert.equal(driver.getAccessibilityState().textSize, 'extra-large');
        assert.equal(driver.getDOMState()['data-text-size'], 'extra-large');
      }
    }
  ];

  return tests;
}
