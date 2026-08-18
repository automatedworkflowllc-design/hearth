import { describe, expect, it } from 'vitest';
import { formatResourcePlace } from '../../src/utils/place';
import type { Resource } from '../../src/types';

function resource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: 'test',
    name: 'Test',
    category: 'health',
    description: 'A listing.',
    location: {},
    contacts: [],
    hours: 'Call to confirm',
    tags: [],
    ...overrides,
  };
}

describe('formatResourcePlace', () => {
  it('appends city, state, and ZIP when the street line omits them', () => {
    expect(
      formatResourcePlace(
        resource({
          address: '1200 West Granada Boulevard, Suite 1',
          location: { city: 'Ormond Beach', state: 'FL', zipCode: '32174' },
        })
      )
    ).toBe('1200 West Granada Boulevard, Suite 1, Ormond Beach, FL 32174');
  });

  it('does not duplicate a city already present in the address', () => {
    expect(
      formatResourcePlace(
        resource({
          address: '325 NW 10th Ave, Gainesville, FL 32601',
          location: { city: 'Gainesville', state: 'FL', zipCode: '32601' },
        })
      )
    ).toBe('325 NW 10th Ave, Gainesville, FL 32601');
  });

  it('returns city and state when there is no street address', () => {
    expect(
      formatResourcePlace(
        resource({
          location: { city: 'Gainesville', state: 'FL', zipCode: '32627' },
        })
      )
    ).toBe('Gainesville, FL 32627');
  });
});
