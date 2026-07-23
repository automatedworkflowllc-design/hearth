/**
 * E2E Test Suite - Tier 4: Real-World Application Scenarios
 * Tests realistic multi-step end-to-end user workflows.
 */
import assert from 'node:assert/strict';
import { HubTestDriver } from './harness.js';

export async function runTier4Tests() {
  const tests = [
    {
      name: 'T4.1: Scenario 1 - Emergency Food Support User Workflow',
      fn: () => {
        // Workflow: An individual in need of immediate food assistance arrives at the app.
        // 1. User sets current location in SF Financial District (37.7890, -122.4010).
        // 2. Selects "food" category.
        // 3. Sorts by distance.
        // 4. Inspects closest food resource card.
        // 5. Opens detail view, verifies operating hours, eligibility, and contact details.

        const driver = new HubTestDriver();
        const userLoc = { lat: 37.7890, lng: -122.4010 };

        // Step 1 - 3: Set location, category, sort
        driver.setUserLocation(userLoc).selectCategory('food').setSortBy('distance');
        const foodResources = driver.getVisibleResources();

        assert.ok(foodResources.length >= 1, 'Emergency food search must return at least one food pantry/kitchen');

        // Step 4: Pick closest resource
        const closestFood = foodResources[0];
        assert.equal(closestFood.category, 'food');

        // Step 5: Open detail view and verify critical info for emergency food seeker
        driver.openDetail(closestFood.id);
        const detail = driver.getDetailModal();

        assert.ok(detail !== null, 'Detail modal should open');
        assert.ok(detail.hours.length > 0, 'Food pantry hours of operation must be presented');
        assert.ok(detail.address.length > 0, 'Address must be presented for navigation');
        assert.ok(detail.availability !== undefined, 'Service availability status must be displayed');

        // Close modal after getting directions
        driver.closeDetail();
        assert.equal(driver.getDetailModal(), null);
      }
    },
    {
      name: 'T4.2: Scenario 2 - Low-Vision Healthcare Seeking User Workflow',
      fn: () => {
        // Workflow: A user with low vision accesses the hub to find a free clinic.
        // 1. Immediately turns on High Contrast mode.
        // 2. Adjusts Text Size to Extra Large.
        // 3. Selects "health" category and searches for "clinic".
        // 4. Opens clinic details and verifies phone contact is available to call.

        const driver = new HubTestDriver();

        // Step 1 - 2: Accessibility adjustments
        driver.toggleContrast().setTextSize('extra-large');
        assert.equal(driver.getAccessibilityState().contrastMode, 'high-contrast');
        assert.equal(driver.getAccessibilityState().textSize, 'extra-large');

        // Step 3: Search for health clinic
        driver.selectCategory('health').search('clinic');
        const clinics = driver.getVisibleResources();
        assert.ok(clinics.length > 0, 'Must locate health clinic');

        // Step 4: Verify contact phone number in detail view
        const targetClinic = clinics[0];
        driver.openDetail(targetClinic.id);
        const modal = driver.getDetailModal();

        assert.ok(modal !== null);
        assert.ok(modal.phone && modal.phone.length > 0, 'Phone contact must be available for low-vision user to call');
      }
    },
    {
      name: 'T4.3: Scenario 3 - Multi-Service Support Workflow (Shelter + Legal Aid)',
      fn: () => {
        // Workflow: A user experiencing housing instability needs both emergency shelter and legal assistance.
        // 1. Searches "shelter" category for overnight beds.
        // 2. Selects shelter, verifies eligibility (e.g. adults 18+ or youth).
        // 3. Switches category to "legal" to find tenant eviction defense.
        // 4. Searches "eviction" or "tenant", inspects legal aid center details.

        const driver = new HubTestDriver();

        // Step 1 - 2: Find shelter
        driver.selectCategory('shelter');
        const shelters = driver.getVisibleResources();
        assert.ok(shelters.length >= 1, 'Must find shelter resources');
        const emergencyShelter = shelters[0];
        driver.openDetail(emergencyShelter.id);
        assert.ok(driver.getDetailModal().eligibility !== undefined, 'Shelter eligibility must be presented');
        driver.closeDetail();

        // Step 3 - 4: Navigate to legal support
        driver.selectCategory('legal').search('tenant');
        const legalServices = driver.getVisibleResources();
        assert.ok(legalServices.length >= 1, 'Must find tenant legal assistance');
        driver.openDetail(legalServices[0].id);

        const legalModal = driver.getDetailModal();
        assert.equal(legalModal.category, 'legal');
        assert.ok(legalModal.description.toLowerCase().includes('tenant') || legalModal.tags.includes('tenant'), 'Legal aid description or tags must reference tenant advocacy');
      }
    },
    {
      name: 'T4.4: Scenario 4 - Compact Screen / Mobile View & Map Navigation Workflow',
      fn: () => {
        // Workflow: A user on a mobile viewport toggles between list and map views.
        // 1. Starts in List View.
        // 2. Toggles View Mode to Map View.
        // 3. Inspects map markers corresponding to visible resources.
        // 4. Clicks a map marker, opening the detail modal.
        // 5. Closes detail modal, returning to Map View seamlessly.

        const driver = new HubTestDriver();

        // Step 1: Initial state
        assert.equal(driver.getDOMState()['data-view-mode'], 'list');

        // Step 2: Switch to map mode
        driver.setViewMode('map');
        assert.equal(driver.getDOMState()['data-view-mode'], 'map');

        // Step 3: Get markers
        const markers = driver.getMapMarkers();
        assert.ok(markers.length > 0, 'Map markers must be rendered');

        // Step 4: Click marker to open modal
        const selectedMarker = markers[0];
        driver.openDetail(selectedMarker.id);
        assert.equal(driver.getDOMState()['data-modal-open'], true);
        assert.equal(driver.getDetailModal().id, selectedMarker.id);

        // Step 5: Close modal
        driver.closeDetail();
        assert.equal(driver.getDOMState()['data-modal-open'], false);
        assert.equal(driver.getDOMState()['data-view-mode'], 'map', 'View mode must remain map mode after modal closes');
      }
    }
  ];

  return tests;
}
