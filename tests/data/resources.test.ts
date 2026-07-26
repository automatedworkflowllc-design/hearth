import { describe, expect, it } from 'vitest';
import { mockResources } from '../../src/data/resources';

describe('release-reviewed resource contacts', () => {
  it('uses Three Rivers Legal first-party intake information', () => {
    const resource = mockResources.find((item) => item.id === 'three-rivers-legal');

    expect(resource?.review?.status).toBe('standard');
    expect(resource?.review?.reviewedAt).toBe('2026-07-25');
    expect(resource?.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Call legal intake',
          href: 'tel:18662568091',
          primary: true,
        }),
        expect.objectContaining({
          label: 'Apply online',
          href: 'https://www.trls.org/apply-online/',
        }),
        expect.objectContaining({
          label: 'Gainesville office',
          href: 'tel:3523720519',
        }),
      ])
    );
  });

  it('includes the officially published 211 text and chat options', () => {
    const resource = mockResources.find((item) => item.id === 'united-way-211');

    expect(resource?.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Text your ZIP code', href: 'sms:898211' }),
        expect.objectContaining({ label: 'Chat with 211', href: 'https://www.hfuw.org/chat/' }),
      ])
    );
  });
});
