import {
    type Event,
    type Keypair,
    EventKind,
    hashEvent,
    mkPool,
    signEvent
} from '..';

import schema from '../schema/nostr.json';
import { type Schema, validate } from 'jtd';

import { schnorr, utils } from '@noble/secp256k1';

jest.mock('cross-fetch', () => require('fetch-mock-jest').sandbox());
export const fetch = require('cross-fetch');

export const mockWsUrl = 'ws://localhost:9876';
export const mockWsFactory = (url: string|URL) => new WebSocket(url);

export const initPool = async () => {
    const pool = mkPool(mockWsFactory);
    await pool.connect(mockWsUrl, true);
    return pool;
};

export const stdSk = '7f2c59ec89ec1bdb3b0ba760d747ae3ec3402afeaf227d27883f71eb9a56dde6';

export const stdKeypair: Keypair = {
    sk: stdSk,
    pk: utils.bytesToHex(schnorr.getPublicKey(stdSk))
};

export const mkEvent: (defaults?: Partial<Event>) => Promise<Event> =
    async (defaults = {}) =>
        await signEvent(await hashEvent({
            content: defaults.content || '',
            pubkey: defaults.pubkey || stdKeypair.pk,
            tags: defaults.tags || [['#p', stdKeypair.pk]],
            created_at: defaults.created_at || Date.now(),
            kind: defaults.kind || EventKind.Text,
        }), stdKeypair);

export const sleep = (ms: number) => new Promise((accept, _reject) => {
    setTimeout(accept, ms);
});
