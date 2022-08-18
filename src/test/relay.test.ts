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

import { mkEvent, sleep, stdKeypair, validateEvent } from './utils';

import {
    type Event,
    defaultFilters,
    mkPool,
    relayInfoUrl,
    verifyEvent
} from '..';

const mockWsUrl = 'ws://localhost:9876';
let server: WS;

beforeAll(() => {
    fetch.config.fallbackToNetwork = true;
    fetch.config.warnOnFallback = false;
});

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
    const pool = await initPool();

    const mailbox: Event[] = [];

    expect(pool.conns.length).toBe(1);

    const filters = defaultFilters(stdKeypair.pk);

    const receipt = pool.subscribe(async (e: Event) => {
        mailbox.push(e);
    }, undefined, ...filters);

    expect(await server.nextMessage)
        .toBe(JSON.stringify(['REQ', receipt.subId, ...filters]));

    expect(mailbox.length).toBe(0);

    const event = await mkEvent();
    pool.publish(event);

    expect(await server.nextMessage)
        .toBe(JSON.stringify(['EVENT', event]));

    await server.send(JSON.stringify(['EVENT', receipt.subId, event]));

    expect(mailbox.length).toBe(1);
    expect(mailbox[0]).toEqual(event);

    pool.close();
});

test('multiple-filters', async () => {
    const pool = await initPool();

    const event1 = await mkEvent();
    const event2 = await mkEvent();

    let received1: Event|undefined = undefined;

    const receipt1 = pool.subscribe(async (e: Event) => {
        received1 = e;
    }, undefined, { ids: [event1.id] });

    let received2: Event|undefined = undefined;

    const receipt2 = pool.subscribe(async (e: Event) => {
        received2 = e;
    }, undefined, { ids: [event2.id] });

    pool.publish(event1);

    await server.send(JSON.stringify([
        'EVENT',
        receipt1.subId,
        event1
    ]));

    expect(received1).toEqual(event1);

    pool.publish(event2);

    await server.send(JSON.stringify([
        'EVENT',
        receipt2.subId,
        event2
    ]));

    expect(received2).toEqual(event2);
    expect(received1).not.toEqual(event2);
});

test('one-time', async () => {
    const pool = await initPool();
    const event = await mkEvent('oneshot queries');
    const filter = { ids: [event.id] };

    await pool.publish(event);

    let f1 = { ids: [event.id] };
    let q = pool.query(f1, 100);

    await server.nextMessage;
    expect(await server.nextMessage)
        .toEqual(JSON.stringify(['REQ', q.subId, f1]));

    await server.send(JSON.stringify(['EVENT', q.subId, event]));

    const result = await q.query;
    expect(result).toEqual(event);

    let q2 = pool.query({ '#e': ['nosuchevent'] }, 100);
    await expect(q2.query).rejects.toThrow(Error);

    await sleep(250);
    expect(q2.subId).not.toBe(q.subId);
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

