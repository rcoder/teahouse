import {
    type Event,
    type Fetch,
    type Keypair,
    bytesToHex,
    EventKind,
    getPublicKey,
    mkPool,
    signEvent
} from '..';

import { Either } from 'prelude-ts';

import schema from '../schema/nostr.json';
import { type Schema, validate } from 'jtd';

jest.mock('cross-fetch', () => require('fetch-mock-jest').sandbox());
export const fetch = require('cross-fetch');

export const mockWsUrl = 'ws://localhost:9876';
export const mockWsFactory = (url: string|URL) => new WebSocket(url);

export const initPool = async () => {
    const pool = mkPool(mockWsFactory);
    await pool.connect(mockWsUrl);
    return pool;
};

export const stdSk = '7f2c59ec89ec1bdb3b0ba760d747ae3ec3402afeaf227d27883f71eb9a56dde6';

export const stdKeypair: Keypair = {
    sk: stdSk,
    pk: bytesToHex(getPublicKey(stdSk))
};

export const mkEvent: (content?: string, kind?: EventKind, ts?: number) => Promise<Event> =
    async (content = '', kind = EventKind.Text, ts = Date.now()) => await signEvent({
        kind,
        content,
        pubkey: stdKeypair.pk,
        tags: [['#p', stdKeypair.pk]],
        created_at: ts,
    }, stdKeypair);

export const validateEvent = (event: unknown) => {
    const errors = validate(schema.event as Schema, event);
    return (errors.length === 0) ? Either.left(event) : Either.right(errors);
}

export const sleep = (ms: number) => new Promise((accept, _reject) => {
    setTimeout(accept, ms);
});
