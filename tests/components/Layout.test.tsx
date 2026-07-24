import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import Layout from '../../src/components/Layout';

describe('Layout Component', () => {
  it('renders skip link, landmarks, and child content', () => {
    render(
      <Layout>
        <div data-testid="test-child">Child Content Test</div>
      </Layout>
    );

    // 1. Verify Skip Link
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');

    // 2. Verify ARIA Landmarks. The page <h1> now lives in the App-level Hero, not in Layout
    // (the old duplicate Header banner was removed), but the banner landmark still exists.
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo', { name: /site footer/i })).toBeInTheDocument();

    // 3. Verify Child Content
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toHaveTextContent('Child Content Test');
  });

  it('renders the always-available Quick Exit escape control', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    expect(screen.getByRole('button', { name: /leave quickly/i })).toBeInTheDocument();
  });

  it('triggers search callback when search button is clicked in Navbar', () => {
    const handleSearchClick = vi.fn();
    render(
      <Layout onSearchClick={handleSearchClick}>
        <div>Test Content</div>
      </Layout>
    );

    const searchButton = screen.getByRole('button', { name: /jump to search/i });
    searchButton.click();
    expect(handleSearchClick).toHaveBeenCalledTimes(1);
  });
});
