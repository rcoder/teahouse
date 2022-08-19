import { schnorr, utils } from '@noble/secp256k1';
import type { Event, Filter } from './schema';

const { bytesToHex, hexToBytes, sha256, randomPrivateKey } = utils;
const { getPublicKey, sign, verify } = schnorr;

export {
    bytesToHex,
    hexToBytes,
    getPublicKey,
    randomPrivateKey,
    sha256,
    sign,
    verify,
};

export enum EventKind {
    Metadata = 0,
    Text = 1,
    RelayRec = 2,
    Contacts = 3,
    DM = 4,
    Deleted = 5,
}

export type Keypair = {
    pk: string,
    sk: string,
};

export type PresignEvent = Omit<Event, 'id'|'sig'>;
export type KindedEvent<K extends EventKind> = Event & { kind: K };

export const signEvent = async (event: PresignEvent, keys: Keypair) => {
    const signingForm = [
        0,
        event.pubkey,
        event.created_at,
        event.kind,
        event.tags,
        event.content,
    ];

    const signingPayload = JSON.stringify(signingForm);
    const id = bytesToHex(await sha256(new TextEncoder().encode(signingPayload)));
    const sig = bytesToHex(await sign(id, keys.sk));

    const signed = {
        ...event,
        id,
        sig,
    };

    return signed;
}

export const verifyEvent = (event: Event) => {
    const pkBytes = hexToBytes(event.pubkey);
    return verify(event.sig, event.id, pkBytes);
}

export const defaultFilters: (pubkey: string) => Filter[] = (pubkey) => [
    { kinds: [1], "#p": [pubkey], },
    { kinds: [1], authors: [pubkey], },
];

