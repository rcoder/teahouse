import { describe, expect, test } from '@jest/globals';

import { type Event, type Filter } from '..';
import { matches, matchesAll } from '../filter';
import { mkEvent } from './utils';

test('matching', async () => {
    const event = await mkEvent('filter test');

    expect(matches(event, {})).toBe(true);

    const matchFilters = [
        { ids: [event.id] },
        { authors: [event.pubkey] },
        { kinds: [event.kind] },
        { '#p': [event.pubkey] },
        { since: event.created_at - 1000 },
        { until: event.created_at + 1000 },
    ];

    for (const filter of matchFilters) {
        expect(matches(event, filter)).toBe(true);
    }

    const noMatchFilters = [
        { ids: ['no-such-message'] },
        { authors: ['no-such-author'] },
        { kinds: [-1] },
        { '#e': ['still-no-message'] },
        { '#p': ['still-no-author'] },
        { since: new Date(2099, 1, 1).getTime() },
    ];

    for (const filter of noMatchFilters) {
        expect(matches(event, filter)).toBe(false);
    }
});
