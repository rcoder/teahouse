import { afterEach, beforeAll, beforeEach, expect, jest, test } from '@jest/globals';

import { WebSocket } from 'mock-socket';
import WS from 'jest-websocket-mock';
import type { FetchMockStatic } from 'fetch-mock';
import 'fetch-mock-jest';

import { type Schema, validate } from 'jtd';
import schema from '../schema/nostr.json';

import { mkEvent, stdKeypair, validateEvent } from './utils';

import { type Event, defaultFilters, fetchRelayInfo, mkPool, relayInfoUrl, verifyEvent } from '..';

jest.mock(
    'cross-fetch',
    () => require('fetch-mock-jest').sandbox()
);


const mockWsUrl = 'ws://localhost:9876';
let server: WS;
let fetchMock: FetchMockStatic;

beforeAll(async () => {
    fetchMock = (require('cross-fetch') as unknown) as FetchMockStatic;
});

beforeEach(() => {
    server = new WS(mockWsUrl);
    fetchMock.reset();
});

afterEach(() => {
    WS.clean();
});

const mockWsFactory = (url: string) => new WebSocket(url);

const initPool = async () => {
    const pool = mkPool(mockWsFactory);
    await pool.connect(mockWsUrl);
    await server.connected;

    return pool;
};

test('pool-connect', async () => {
    fetchMock.mock('*', { body: '', status: 404 });
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

    pool.close();
});

test('relay-info', async () => {
    const relayInfo = {
        name: 'mock relay',
        pubkey: stdKeypair.pk,
        supported_nips: [5, 11],
    };

    const urlStr = relayInfoUrl(mockWsUrl).toString();
    fetchMock.get(urlStr, relayInfo);

    const pool = mkPool(mockWsFactory);

    const fetchedInfo = await pool.connect(mockWsUrl);
    await server.connected;
    expect(fetchedInfo).toEqual(relayInfo);

    pool.close();
});

