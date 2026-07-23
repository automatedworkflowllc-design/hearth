/**
 * Opaque-Box E2E Test Harness / Driver for Community Resource Hub
 * Provides a clean high-level API to interact with the application state & DOM contracts.
 */
import { searchResources, getResourceById, calculateDistance } from '../../src/services/resourceService.ts';
import { mockResources } from '../../src/data/resources.ts';

export class HubTestDriver {
  constructor(customDataset = mockResources) {
    this.dataset = customDataset;
    this.query = '';
    this.category = 'all';
    this.tags = [];
    this.userLocation = undefined;
    this.sortBy = 'relevance';
    this.viewMode = 'list'; // 'list' | 'map' | 'split'
    this.activeModalId = null;
    this.contrastMode = 'standard'; // 'standard' | 'high-contrast'
    this.textSize = 'normal'; // 'normal' | 'large' | 'extra-large'
  }

  // Action Methods
  search(queryStr) {
    this.query = queryStr;
    return this;
  }

  selectCategory(categoryStr) {
    this.category = categoryStr;
    return this;
  }

  setTags(tagsList) {
    this.tags = Array.isArray(tagsList) ? [...tagsList] : [];
    return this;
  }

  setUserLocation(location) {
    this.userLocation = location;
    return this;
  }

  setSortBy(sortByMode) {
    this.sortBy = sortByMode;
    return this;
  }

  setViewMode(mode) {
    this.viewMode = mode;
    return this;
  }

  openDetail(resourceId) {
    const res = getResourceById(resourceId, this.dataset);
    if (res) {
      this.activeModalId = resourceId;
    } else {
      this.activeModalId = null;
    }
    return this;
  }

  closeDetail() {
    this.activeModalId = null;
    return this;
  }

  toggleContrast() {
    this.contrastMode = this.contrastMode === 'standard' ? 'high-contrast' : 'standard';
    return this;
  }

  setTextSize(size) {
    this.textSize = size;
    return this;
  }

  resetFilters() {
    this.query = '';
    this.category = 'all';
    this.tags = [];
    this.userLocation = undefined;
    this.sortBy = 'relevance';
    this.activeModalId = null;
    return this;
  }

  // Inspection / Query Methods
  getVisibleResources() {
    return searchResources(
      this.query,
      this.category,
      this.tags,
      this.userLocation,
      this.sortBy,
      this.dataset
    );
  }

  getMapMarkers() {
    const resources = this.getVisibleResources();
    return resources.map(res => ({
      id: res.id,
      title: res.name,
      location: res.location,
      category: res.category
    }));
  }

  getDetailModal() {
    if (!this.activeModalId) return null;
    return getResourceById(this.activeModalId, this.dataset) || null;
  }

  getAccessibilityState() {
    return {
      contrastMode: this.contrastMode,
      textSize: this.textSize
    };
  }

  getDOMState() {
    return {
      'data-contrast': this.contrastMode,
      'data-text-size': this.textSize,
      'data-view-mode': this.viewMode,
      'data-modal-open': this.activeModalId !== null,
      'data-active-modal-id': this.activeModalId,
      'data-results-count': this.getVisibleResources().length
    };
  }
}
