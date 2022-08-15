import { test, expect } from '@jest/globals';
import { stdKeypair, mkEvent } from './utils';

import {
    verifyEvent,
} from '..';

test('event-signing', async () => {
    const event = await mkEvent();

    expect(event.id).toBe(
        '82f917766ae7338c7232dfa92bba45d7de1d1e192ec36a46c4b0fca046066669'
    );

    expect(await verifyEvent(event, stdKeypair.pk)).toBe(true);
});
