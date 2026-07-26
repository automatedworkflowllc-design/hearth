import { describe, expect, it } from 'vitest';
import { phoneHref } from '../../src/utils/contact';

describe('phoneHref', () => {
  it('turns a formatted phone number into a dialable target', () => {
    expect(phoneHref('(352) 336-0839')).toBe('tel:3523360839');
  });

  it('uses the primary route when a listing includes an alternate number', () => {
    expect(phoneHref('211 or (352) 332-4636')).toBe('tel:211');
  });
});
