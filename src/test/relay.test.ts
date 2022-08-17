import {
    afterEach,
    beforeAll,
    beforeEach,
    expect,
    jest,
    test
} from '@jest/globals';

import { WebSocket } from 'mock-socket';
import WS from 'jest-websocket-mock';

jest.mock('cross-fetch', () => require('fetch-mock-jest').sandbox());
const fetch = require('cross-fetch');

import { type Schema, validate } from 'jtd';
import schema from '../schema/nostr.json';

import { mkEvent, stdKeypair, validateEvent } from './utils';

import {
    type Event,
    defaultFilters,
    mkPool,
    relayInfoUrl,
    verifyEvent
} from '..';

const mockWsUrl = 'ws://localhost:9876';
let server: WS;

beforeEach(() => {
    server = new WS(mockWsUrl);
    fetch.reset();
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
    fetch.once('*', { body: '', status: 404 });
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
    fetch.once('*', relayInfo);

    const pool = mkPool(mockWsFactory);

    const fetchedInfo = await pool.connect(mockWsUrl);
    await server.connected;
    expect(fetchedInfo).toEqual(relayInfo);

    pool.close();
});

