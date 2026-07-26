import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Hero } from '../../src/components/Hero';

function renderHero(nationalDirectory = false) {
  const onCategorySelect = vi.fn();
  render(
    <Hero
      searchQuery=""
      onSearchChange={vi.fn()}
      onSearchSubmit={vi.fn()}
      onCategorySelect={onCategorySelect}
      nationalDirectory={nationalDirectory}
    />
  );
  return { onCategorySelect };
}

describe('Hero need shortcuts', () => {
  it('shows only data-backed need paths in the national directory', () => {
    renderHero(true);

    expect(screen.getByRole('button', { name: /medical care/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mental health/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /substance-use help/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /detox support/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /free summer meals/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /warm bed, housing, or legal help/i })).toHaveAttribute(
      'href',
      'tel:211'
    );
  });

  it('turns a national shortcut into a semantic need selection', () => {
    const { onCategorySelect } = renderHero(true);
    fireEvent.click(screen.getByRole('button', { name: /mental health/i }));
    expect(onCategorySelect).toHaveBeenCalledWith('mental-health');

    fireEvent.click(screen.getByRole('button', { name: /free summer meals/i }));
    expect(onCategorySelect).toHaveBeenCalledWith('food');
  });

  it('preserves the reviewed local-demo shortcuts', () => {
    renderHero();
    expect(screen.getByRole('button', { name: /food today/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /a safe place/i })).toBeInTheDocument();
  });
});
