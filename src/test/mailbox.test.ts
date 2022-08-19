import {
    beforeAll,
    beforeEach,
    expect,
    jest,
    test
} from '@jest/globals';

import { type Mailbox, type Message, mkMailbox, mkMessage } from '../mailbox';

import { WebSocket } from 'mock-socket';
import WS from 'jest-websocket-mock';

import { fetch, initPool, mkEvent, mockWsUrl } from './utils';

let server: WS;

beforeAll(() => {
    fetch.config.fallbackToNetwork = true;
    fetch.config.warnOnFallback = false;
});

beforeEach(() => {
    server = new WS(mockWsUrl);
});

test('find-related', async () => {
    const pool = await initPool();
    const mbox = mkMailbox(pool);

    const event = await mkEvent({});
    const event2 = await mkEvent({ tags: [['#e', event.id]] });
    const msg = await mkMessage(event);

    mbox.index(msg, true, 1000);
    // there's an implicit expectation that b/c the pool is empty
    // we'll only return a result for already-fetch events
    expect(mbox.find(event2.id)).not.toBe(undefined);
});
