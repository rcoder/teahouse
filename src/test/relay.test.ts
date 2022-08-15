import { test, expect } from '@jest/globals';
import WS from 'jest-websocket-mock';

import { mkEvent, stdKeypair } from './utils';

import { type Event, mkPool } from '..';

const mockWsUrl = 'ws://localhost:9876';
const server = new WS(mockWsUrl);

test('pool-connect', async () => {
    const pool = mkPool();
    await pool.connect(mockWsUrl);

    await server.connected;
    expect(pool.conns.length).toBe(1);

    const mailbox: Event[] = [];
    const filter = { authors: [stdKeypair.pk] };

    pool.subscribe(async (e: Event) => { mailbox.push(e); });

    const subId = pool.addFilter(filter);
    expect(await server.nextMessage).toBe(JSON.stringify(["REQ", subId, filter]));

    const event = await mkEvent();
    pool.publish(event);
    expect(await server.nextMessage).toBe(JSON.stringify(["EVENT", event]));

    WS.clean();
});
