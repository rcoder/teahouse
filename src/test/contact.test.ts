import {
    beforeAll,
    beforeEach,
    expect,
    test,
    jest
} from '@jest/globals';

import { type Metadata, EventKind, resolver } from '..';
import { parseNip05Name, nip05Url } from '../contact';

import { mkEvent, stdKeypair } from './utils';

jest.mock('cross-fetch', () => require('fetch-mock-jest').sandbox());
const fetch = require('cross-fetch');

beforeAll(() => {
    fetch.config.fallbackToNetwork = true;
    fetch.config.warnOnFallback = false;
});

beforeEach(() => {
    fetch.reset();
});

const n05MetaFor = async (alias: string) =>
    await mkEvent({
        content: JSON.stringify({ nip05: alias }),
        kind: EventKind.Metadata
    });

test('parsing', async () => {
    const good = 'me@example.com';
    expect(parseNip05Name(good)).toEqual({
        local: 'me',
        domain: 'example.com'
    });

    const bad = "memememe!";
    expect(parseNip05Name(bad)).toBe(undefined);
});

test('validation', async () => {
    const { check } = resolver();
    let event = await n05MetaFor('faker@example.com');

    expect(await check(event)).toBe(false);

    fetch.once('*', { legit: stdKeypair.pk });

    event = await n05MetaFor('legit@example.com');
    expect(await check(event)).toBe(true);
});

test('cache', async () => {
    const { check, reset } = resolver();
    let event = await n05MetaFor('temp@example.com');

    expect(await check(event)).toBe(false);

    // invalidate the initial failure
    reset();
    fetch.once('*', { temp: stdKeypair.pk });

    expect(await check(event)).toBe(true);

    // now remove the http mock...
    fetch.reset();
    // ...and the cache still says "ok"
    expect(await check(event)).toBe(true);

    // then we empty the ident cache...
    reset();
    // ...and the check goes back to failing
    expect(await check(event)).toBe(false);
});
