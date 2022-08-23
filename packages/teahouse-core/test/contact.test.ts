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
    const goodName = parseNip05Name(good);
    const goodUrl = nip05Url(goodName!);

    expect(goodName).toEqual({
        local: 'me',
        domain: 'example.com'
    });

    expect(goodUrl).toEqual(new URL(
        'https://example.com/.well-known/nostr.json?name=me'
    ));

    const bad = "memememe!";
    const badName = parseNip05Name(bad);
    expect(badName).toBe(undefined);
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
