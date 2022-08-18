import { test, expect } from '@jest/globals';
import { stdKeypair, mkEvent } from './utils';

import { EventKind, verifyEvent } from '..';

test('event-signing', async () => {
    const event = await mkEvent(
        'test event',
        EventKind.Text,
        new Date(2022, 1, 1).getTime()
    );

    expect(event.id).toBe(
        'b05fe61db1a646ef1e10995cde8b60e35146c9493b4adc0138c3605f1f538f04'
    );

    expect(await verifyEvent(event)).toBe(true);
});
