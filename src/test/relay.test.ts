import { test, expect } from '@jest/globals';
import WS from 'jest-websocket-mock';

import { type Schema, validate } from 'jtd';
import schema from '../schema/nostr.json';

import { mkEvent, stdKeypair, validateEvent } from './utils';

import { type Event, defaultFilters, mkPool, verifyEvent } from '..';

const mockWsUrl = 'ws://localhost:9876';
const server = new WS(mockWsUrl);

const initPool = async () => {
    const pool = mkPool();
    await pool.connect(mockWsUrl);
    await server.connected;

    return pool;
}

test('pool-connect', async () => {
    const pool = await initPool();

    const mailbox: Event[] = [];

    expect(pool.conns.length).toBe(1);

    pool.subscribe(async (e: Event) => {
        if (e) {
            mailbox.push(e);
        }
    });

    const filter = defaultFilters(stdKeypair.pk);
    const subId = pool.addFilter(...filter);

    expect(await server.nextMessage)
        .toBe(JSON.stringify(["REQ", subId, ...filter]));

    expect(mailbox.length).toBe(0);

    const event = await mkEvent();
    pool.publish(event);

    expect(await server.nextMessage)
        .toBe(JSON.stringify(["EVENT", event]));

    await server.send(JSON.stringify(["EVENT", subId, event]));

    expect(mailbox.length).toBe(1);
    expect(mailbox[0]).toEqual(event);

    WS.clean();
});

