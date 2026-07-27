import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResourceDetailModal } from '../../src/components/ResourceDetailModal';
import type { Resource } from '../../src/types';

const resource: Resource = {
  id: 'release-check',
  name: 'Release Check Resource',
  category: 'support',
  description: 'A source-backed test listing.',
  address: '100 Main St',
  location: { city: 'Anywhere', state: 'US', zipCode: '00000' },
  contacts: [
    {
      type: 'phone',
      label: 'Call',
      value: '(800) 555-0100',
      href: 'tel:18005550100',
      primary: true,
    },
    {
      type: 'intake',
      label: 'Online intake',
      value: 'example.org/intake',
      href: 'https://example.org/intake',
    },
  ],
  hours: 'Call for current hours',
  tags: ['support'],
  review: {
    reviewedAt: '2026-07-01',
    reviewDueAt: '2026-06-01',
    status: 'exception',
    note: 'Direct confirmation is still required.',
    sources: [
      {
        name: 'Official source',
        url: 'https://example.org/resource',
        kind: 'official',
      },
    ],
  },
};

describe('ResourceDetailModal release behaviors', () => {
  it('traps focus, closes with Escape, and restores the opening focus', () => {
    const onClose = vi.fn();
    const view = render(
      <>
        <button type="button">Open resource</button>
        <ResourceDetailModal resource={null} onClose={onClose} />
      </>
    );
    const opener = screen.getByRole('button', { name: /open resource/i });
    opener.focus();

    view.rerender(
      <>
        <button type="button">Open resource</button>
        <ResourceDetailModal resource={resource} onClose={onClose} />
      </>
    );

    const close = screen.getByRole('button', { name: /^close$/i });
    const report = screen.getByRole('link', { name: /report outdated information/i });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(report).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    view.rerender(
      <>
        <button type="button">Open resource</button>
        <ResourceDetailModal resource={null} onClose={onClose} />
      </>
    );
    expect(screen.getByRole('button', { name: /open resource/i })).toHaveFocus();
  });

  it('renders safe contact, provenance, exception, and correction links', () => {
    render(<ResourceDetailModal resource={resource} onClose={() => {}} />);

    expect(screen.getByRole('link', { name: /^call/i })).toHaveAttribute('href', 'tel:18005550100');
    expect(screen.getByRole('link', { name: /online intake/i })).toHaveAttribute(
      'href',
      'https://example.org/intake'
    );
    expect(screen.getByRole('link', { name: /online intake/i })).toHaveAttribute(
      'rel',
      'noopener noreferrer'
    );
    expect(screen.getByRole('heading', { name: /confirmation needed/i })).toBeInTheDocument();
    expect(screen.getByText(/direct confirmation is still required/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /official source/i })).toHaveAttribute(
      'href',
      'https://example.org/resource'
    );

    const report = screen.getByRole('link', { name: /report outdated information/i });
    expect(report.getAttribute('href')).toMatch(/^mailto:automatedworkflowllc@gmail\.com/);
    expect(decodeURIComponent(report.getAttribute('href') ?? '')).toContain(
      'Hearth listing update: Release Check Resource'
    );
    expect(screen.getByText(/do not include private or sensitive personal information/i)).toBeInTheDocument();
  });
});
