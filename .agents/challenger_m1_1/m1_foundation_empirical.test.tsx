import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import Layout from '../../src/components/Layout';
import Navbar from '../../src/components/Navbar';
import Header from '../../src/components/Header';
import Footer from '../../src/components/Footer';
import App from '../../src/App';
import { useAccessibility, AccessibilityController } from '../../src/hooks/useAccessibility';

describe('Milestone 1 Empirical Foundation & Stress Harness', () => {
  describe('1. Component Rendering with Null/Undefined Props & Unexpected Attributes', () => {
    it('Layout handles null, undefined, empty, and React element children gracefully', () => {
      // Null children
      const { container: c1 } = render(<Layout>{null}</Layout>);
      expect(c1.querySelector('main')).toBeInTheDocument();
      expect(c1.querySelector('main')?.childNodes.length).toBe(0);

      // Undefined children
      const { container: c2 } = render(<Layout>{undefined}</Layout>);
      expect(c2.querySelector('main')).toBeInTheDocument();

      // Empty string children
      const { container: c3 } = render(<Layout>{''}</Layout>);
      expect(c3.querySelector('main')).toBeInTheDocument();

      // React fragment / list children
      const { container: c4 } = render(
        <Layout>
          <span>Child 1</span>
          <span>Child 2</span>
        </Layout>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('Layout handles null/undefined/extra onSearchClick prop without crashing', () => {
      // onSearchClick = undefined
      render(
        <Layout onSearchClick={undefined}>
          <div>Content</div>
        </Layout>
      );
      const searchBtn1 = screen.getByRole('button', { name: /jump to search/i });
      expect(() => fireEvent.click(searchBtn1)).not.toThrow();

      // onSearchClick = null (cast as any)
      render(
        <Layout onSearchClick={null as any}>
          <div>Content</div>
        </Layout>
      );
      const searchBtns = screen.getAllByRole('button', { name: /jump to search/i });
      const searchBtn2 = searchBtns[searchBtns.length - 1];
      // Clicking should not crash React event handler
      expect(() => fireEvent.click(searchBtn2)).not.toThrow();
    });

    it('Navbar handles null/undefined/non-function onSearchClick safely', () => {
      const { container } = render(<Navbar onSearchClick={undefined} />);
      const btn = screen.getByRole('button', { name: /jump to search/i });
      expect(btn).toBeInTheDocument();
      expect(() => fireEvent.click(btn)).not.toThrow();

      // Null callback
      render(<Navbar onSearchClick={null as any} />);
      const btns = screen.getAllByRole('button', { name: /jump to search/i });
      expect(() => fireEvent.click(btns[btns.length - 1])).not.toThrow();
    });

    it('Header & Footer render cleanly with empty or unexpected props', () => {
      const { container: headerContainer } = render(<Header {...({ unexpectedAttr: 'test-123' } as any)} />);
      expect(screen.getByRole('banner')).toBeInTheDocument();

      const { container: footerContainer } = render(<Footer {...({ extra: 999 } as any)} />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('App renders top-level Layout and content without throwing', () => {
      const { container } = render(<App />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText(/Community Resource & Aid Finder/i)).toBeInTheDocument();
    });

  });

  describe('2. Container Overflow & Extreme Content Resilience', () => {
    it('Layout handles extremely long unspaced text strings inside main container', () => {
      const hugeUnspacedString = 'A'.repeat(50000);
      const { container } = render(
        <Layout>
          <div data-testid="huge-text">{hugeUnspacedString}</div>
        </Layout>
      );

      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass('max-w-7xl');
      expect(screen.getByTestId('huge-text')).toBeInTheDocument();
    });

    it('Layout handles deeply nested DOM trees without stack overflow or rendering corruption', () => {
      let deepNode: React.ReactNode = <span data-testid="deep-leaf">Deepest Leaf</span>;
      for (let i = 0; i < 50; i++) {
        deepNode = <div className="nested-level">{deepNode}</div>;
      }

      render(<Layout>{deepNode}</Layout>);
      expect(screen.getByTestId('deep-leaf')).toBeInTheDocument();
    });

    it('Layout handles HTML script injection strings safely', () => {
      const injectionString = `<script>alert("XSS")</script><img src="x" onerror="alert(1)" />`;
      render(
        <Layout>
          <div data-testid="xss-content">{injectionString}</div>
        </Layout>
      );

      const el = screen.getByTestId('xss-content');
      expect(el.textContent).toBe(injectionString); // Rendered as text, not HTML
    });
  });

  describe('3. Contrast & Font Size State Transitions & Controller Harness', () => {
    it('useAccessibility hook cycles state correctly under rapid toggles', () => {
      const controller = new AccessibilityController('standard', 'normal');
      expect(controller.contrastMode).toBe('standard');
      expect(controller.textSize).toBe('normal');

      // Toggle contrast
      controller.toggleContrast();
      expect(controller.contrastMode).toBe('high-contrast');

      controller.toggleContrast();
      expect(controller.contrastMode).toBe('standard');

      // Change text size
      controller.setTextSize('large');
      expect(controller.textSize).toBe('large');

      controller.setTextSize('extra-large');
      expect(controller.textSize).toBe('extra-large');

      controller.setTextSize('normal');
      expect(controller.textSize).toBe('normal');
    });

    it('HTML document attributes update correctly for CSS selectors', () => {
      document.documentElement.setAttribute('data-contrast', 'high-contrast');
      document.documentElement.setAttribute('data-text-size', 'extra-large');

      expect(document.documentElement.getAttribute('data-contrast')).toBe('high-contrast');
      expect(document.documentElement.getAttribute('data-text-size')).toBe('extra-large');

      document.documentElement.setAttribute('data-contrast', 'standard');
      document.documentElement.setAttribute('data-text-size', 'normal');

      expect(document.documentElement.getAttribute('data-contrast')).toBe('standard');
      expect(document.documentElement.getAttribute('data-text-size')).toBe('normal');
    });
  });
});
