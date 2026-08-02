import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SafetyBar } from '../../src/components/SafetyBar';

describe('SafetyBar crisis actions', () => {
  it('uses the intended emergency and crisis contact destinations', () => {
    render(<SafetyBar />);

    expect(screen.getByRole('link', { name: /call 911/i })).toHaveAttribute('href', 'tel:911');
    expect(screen.getByRole('link', { name: /call 988/i })).toHaveAttribute('href', 'tel:988');
    expect(screen.getByRole('link', { name: /text 988/i })).toHaveAttribute('href', 'sms:988');
    expect(
      screen.getByRole('link', { name: /call the national domestic violence hotline/i })
    ).toHaveAttribute('href', 'tel:18007997233');
    // body=START prefills the keyword the shortcode requires -- without it the
    // composer opens empty and the user must remember to type START themselves.
    expect(
      screen.getByRole('link', { name: /text start to 88788/i })
    ).toHaveAttribute('href', 'sms:88788?body=START');
  });
});
