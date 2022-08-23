import {
    beforeAll,
    beforeEach,
    expect,
    jest,
    test
} from '@jest/globals';

jest.mock('ulid');
const { ulid } = require('ulid');

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

afterEach(() => {
    WS.clean();
});

test('find-related', async () => {
    const pool = await initPool();
    const mbox = mkMailbox(pool);

    const event = await mkEvent({});
    pool.publish(event);
    await server.nextMessage;

    const event2 = await mkEvent({ tags: [['#e', event.id]] });
    pool.publish(event2);
    await server.nextMessage;

    const msg = await mkMessage(event);

    ulid.mockImplementation(() => 'my-sub');
    mbox.index(msg, true, 1000);
    expect(await server.nextMessage).toBe(
        JSON.stringify(["REQ", 'my-sub', { '#e': [event.id] }])
    );

    server.send(JSON.stringify(["EVENT", 'my-sub', event2]));
    await server.nextMessage;

    // there's an implicit expectation that b/c the pool is empty
    // we'll only return a result for already-fetched events
    expect(mbox.find(event2.id, false, 1000)).not.toBe(undefined);

    pool.close();
});
