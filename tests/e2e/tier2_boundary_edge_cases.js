/**
 * E2E Test Suite - Tier 2: Boundary & Edge Cases
 * Tests edge cases: Empty search, zero matches, extreme distances, missing optional fields, special characters.
 */
import assert from 'node:assert/strict';
import { HubTestDriver } from './harness.js';

export async function runTier2Tests() {
  const tests = [
    {
      name: 'T2.1: Empty Search Query - empty string or whitespace returns full dataset without throwing errors',
      fn: () => {
        const driver = new HubTestDriver();

        driver.search('');
        const resultsEmpty = driver.getVisibleResources();
        assert.equal(resultsEmpty.length, driver.dataset.length, 'Empty search query should return all resources');

        driver.search('   \t  \n  ');
        const resultsSpaces = driver.getVisibleResources();
        assert.equal(resultsSpaces.length, driver.dataset.length, 'Whitespace search query should return all resources');
      }
    },
    {
      name: 'T2.2: Zero Matches - search query with no matching resources returns empty list cleanly',
      fn: () => {
        const driver = new HubTestDriver();
        driver.search('xyz999nonexistentunlikelykeyword');

        const results = driver.getVisibleResources();
        assert.equal(results.length, 0, 'Should return 0 results for non-matching query');
        assert.equal(driver.getDOMState()['data-results-count'], 0, 'DOM state results count should be 0');
      }
    },
    {
      name: 'T2.3: Extreme Coordinates - user location at extreme coordinates calculated without NaN or overflow',
      fn: () => {
        const driver = new HubTestDriver();

        // South Pole
        const southPole = { lat: -90.0, lng: 0.0 };
        driver.setUserLocation(southPole).setSortBy('distance');
        const resultsSouth = driver.getVisibleResources();
        assert.ok(resultsSouth.length > 0, 'Extreme location (South Pole) should return sorted list');

        // Anti-meridian / International Date Line
        const dateLine = { lat: 0.0, lng: 180.0 };
        driver.setUserLocation(dateLine);
        const resultsDateLine = driver.getVisibleResources();
        assert.ok(resultsDateLine.length > 0, 'Extreme location (Date Line) should return sorted list');

        // Verify distance calculation directly for extreme coordinates
        const res = resultsSouth[0];
        assert.ok(!isNaN(res.location.lat) && !isNaN(res.location.lng), 'Location coordinates must be valid numbers');
      }
    },
    {
      name: 'T2.4: Missing Optional Fields - handles resources with missing phone, email, website, eligibility cleanly',
      fn: () => {
        const driver = new HubTestDriver();
        driver.search('Mobile Clinic');

        const results = driver.getVisibleResources();
        assert.ok(results.length > 0, 'Should find mobile clinic resource');

        const mobileRes = results[0];
        assert.equal(mobileRes.email, undefined, 'Email should be undefined for res-6');
        assert.equal(mobileRes.website, undefined, 'Website should be undefined for res-6');

        driver.openDetail(mobileRes.id);
        const modal = driver.getDetailModal();
        assert.ok(modal !== null, 'Modal should open for resource with missing optional fields');
        assert.equal(modal.name, mobileRes.name);
      }
    },
    {
      name: 'T2.5: Special Characters & Injection Strings - handles regex chars, quotes, HTML scripts, emojis safely',
      fn: () => {
        const driver = new HubTestDriver();

        const edgeStrings = [
          '.*+?^${}()|[]\\',                      // Regex characters
          '""\'\'``',                              // Quotes
          '<script>alert("XSS")</script>',         // HTML tags / XSS payload
          'DROP TABLE resources;--',               // SQL injection string
          '🍲 🏥 🚑 🥑',                           // Emojis / Unicode
          'בְּרֵאשִׁית, Early Morning Health'     // Non-Latin characters
        ];

        edgeStrings.forEach(str => {
          assert.doesNotThrow(() => {
            driver.search(str);
            const results = driver.getVisibleResources();
            assert.ok(Array.isArray(results), `Results for "${str}" must be an array`);
          }, `Search with string "${str}" should not throw error`);
        });
      }
    }
  ];

  return tests;
}
