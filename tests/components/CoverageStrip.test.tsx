import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CoverageStrip } from '../../src/components/CoverageStrip';

describe('CoverageStrip', () => {
  it('keeps shelter, housing, and legal aid on 211 in the national directory', () => {
    render(<CoverageStrip nationalDirectory />);
    expect(screen.getByRole('heading', { name: /what hearth can search/i })).toBeInTheDocument();
    expect(screen.getByText(/food pantries/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /call 211 for shelter, housing, or legal help/i })).toHaveAttribute(
      'href',
      'tel:211'
    );
  });

  it('does not imply national coverage when the local demo is showing', () => {
    render(<CoverageStrip nationalDirectory={false} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/local demonstration directory/i);
    expect(screen.queryByRole('heading', { name: /what hearth can search/i })).not.toBeInTheDocument();
  });
});
