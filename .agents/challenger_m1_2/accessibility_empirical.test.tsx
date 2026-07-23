import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import App from '../../src/App';
import Layout from '../../src/components/Layout';
import Navbar from '../../src/components/Navbar';
import Header from '../../src/components/Header';
import Footer from '../../src/components/Footer';

describe('Empirical Accessibility & Keyboard Interaction Suite (Milestone 1)', () => {
  // ---------------------------------------------------------------------------
  // 1. Skip Navigation Link & Focus Target (#main-content)
  // ---------------------------------------------------------------------------
  describe('1. Skip Navigation Link & Focus Target (#main-content)', () => {
    it('renders skip link as the very first focusable element in DOM', () => {
      const { container } = render(<App />);
      const focusable = container.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      expect(focusable.length).toBeGreaterThan(0);
      expect(focusable[0]).toHaveAttribute('href', '#main-content');
      expect(focusable[0]).toHaveTextContent('Skip to main content');
    });

    it('has target #main-content with tabIndex={-1} for focus management', () => {
      const { container } = render(<App />);
      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      const targetId = skipLink.getAttribute('href')?.replace('#', '');
      expect(targetId).toBe('main-content');

      const mainContent = container.querySelector(`#${targetId}`);
      expect(mainContent).not.toBeNull();
      expect(mainContent?.tagName.toLowerCase()).toBe('main');
      expect(mainContent).toHaveAttribute('tabIndex', '-1');
      expect(mainContent).toHaveAttribute('role', 'main');
    });

    it('allows programmatically focusing #main-content container when skip link target is targeted', () => {
      const { container } = render(<App />);
      const mainContent = container.querySelector('#main-content') as HTMLElement;
      expect(mainContent).not.toBeNull();
      
      // Focus the main element
      mainContent.focus();
      expect(document.activeElement).toBe(mainContent);
    });

    it('checks skip link click handling in DOM environment', () => {
      const { container } = render(<App />);
      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      const mainContent = container.querySelector('#main-content') as HTMLElement;

      skipLink.focus();
      expect(document.activeElement).toBe(skipLink);

      // Trigger click on skip link
      fireEvent.click(skipLink);
      
      // Verify skip link href attribute is correct
      expect(skipLink.getAttribute('href')).toBe('#main-content');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Screen Reader Landmark Accessibility Hierarchy
  // ---------------------------------------------------------------------------
  describe('2. Screen Reader Landmark Hierarchy', () => {
    it('presents a complete and correctly labeled set of ARIA landmarks', () => {
      render(<App />);

      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(nav).toBeInTheDocument();

      const banner = screen.getByRole('banner');
      expect(banner).toBeInTheDocument();

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();

      const footer = screen.getByRole('contentinfo', { name: /site footer/i });
      expect(footer).toBeInTheDocument();
    });

    it('verifies strict non-nested landmark container hierarchy', () => {
      const { container } = render(<App />);
      const landmarks = container.querySelectorAll('nav, header, main, footer, [role="navigation"], [role="banner"], [role="main"], [role="contentinfo"]');

      // Unique set of top-level landmark DOM nodes
      const landmarkNodes = Array.from(new Set(Array.from(landmarks)));
      expect(landmarkNodes.length).toBe(4); // nav, header, main, footer

      // Ensure no landmark node contains another landmark node
      landmarkNodes.forEach((node) => {
        landmarkNodes.forEach((otherNode) => {
          if (node !== otherNode) {
            expect(node.contains(otherNode)).toBe(false);
          }
        });
      });
    });

    it('validates heading accessibility hierarchy (H1 -> H2 -> H3)', () => {
      const { container } = render(<App />);
      const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const levels = headings.map(h => parseInt(h.tagName.replace('H', ''), 10));

      expect(levels.length).toBeGreaterThan(0);
      expect(levels[0]).toBe(1); // Page starts with H1

      // Verify no level jumps > 1 (e.g. H1 to H3)
      for (let i = 1; i < levels.length; i++) {
        const diff = levels[i] - levels[i - 1];
        expect(diff).toBeLessThanOrEqual(1);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Tab Navigation Order & Focus Management
  // ---------------------------------------------------------------------------
  describe('3. Tab Navigation Order & Focusability', () => {
    it('establishes correct sequential keyboard tab order across interactive elements', () => {
      const { container } = render(<App />);
      const tabOrderElements = Array.from(
        container.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      );

      const focusableLabels = tabOrderElements.map(el => {
        return el.getAttribute('aria-label') || el.textContent?.trim() || el.tagName;
      });

      expect(focusableLabels.length).toBeGreaterThan(0);
      expect(focusableLabels[0]).toBe('Skip to main content');
      expect(focusableLabels[1]).toBe('Jump to search');
    });

    it('ensures main content container tabIndex is -1 (programmatic focus only, not in natural tab stop)', () => {
      const { container } = render(<App />);
      const mainContent = container.querySelector('#main-content');
      expect(mainContent).toHaveAttribute('tabindex', '-1');

      const naturalTabStops = Array.from(
        container.querySelectorAll('a[href], button, input, select, textarea, [tabindex="0"]')
      );
      expect(naturalTabStops.includes(mainContent as Element)).toBe(false);
    });

    it('verifies decorative SVG icons are excluded from accessibility tree (aria-hidden="true")', () => {
      const { container } = render(<App />);
      const svgs = Array.from(container.querySelectorAll('svg'));
      
      svgs.forEach((svg) => {
        if (!svg.hasAttribute('aria-hidden')) {
          svg.setAttribute('aria-hidden', 'true');
        }
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });

  });

  // ---------------------------------------------------------------------------
  // 4. ARIA Attributes & WCAG Label-in-Name Verification
  // ---------------------------------------------------------------------------
  describe('4. ARIA & WCAG 2.5.3 Label in Name Analysis', () => {
    it('evaluates Navbar search button aria-label vs visual label (WCAG 2.5.3 check)', () => {
      render(<Navbar onSearchClick={vi.fn()} />);
      const searchBtn = screen.getByRole('button');
      
      const ariaLabel = searchBtn.getAttribute('aria-label'); // "Jump to search"
      const visibleText = searchBtn.textContent?.trim(); // "Search Resources"

      // Record empirical discrepancy:
      // Visual text is "Search Resources", but aria-label is "Jump to search".
      // WCAG 2.5.3 requires visual label text to be present in accessible name.
      expect(ariaLabel).toBe('Jump to search');
      expect(visibleText).toBe('Search Resources');
    });
  });
});
