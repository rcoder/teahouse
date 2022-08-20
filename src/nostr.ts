import { schnorr, utils } from '@noble/secp256k1';
import type { Event, Filter } from './schema';

const { bytesToHex, hexToBytes, sha256, randomPrivateKey } = utils;
const { getPublicKey, sign, verify } = schnorr;

export {
    bytesToHex,
    hexToBytes,
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

export const keypair = (sk: string) => {
    return {
        sk,
        pk: bytesToHex(getPublicKey(sk)),
    };
};

export const randomKeypair = () => keypair(bytesToHex(randomPrivateKey()));

type PresignEvent = Omit<Event, 'id'|'sig'>;
type KindedEvent<K extends EventKind> = Event & { kind: K };
type SignedEvent = PresignEvent & { id: string };

export const hashEvent: (event: PresignEvent) => Promise<SignedEvent> =
    async (event) => {
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

        return { ...event, id, };
    }

export const signEvent = async (event: SignedEvent, keys: Keypair) => {
    const sig = bytesToHex(await sign(event.id, keys.sk));
    return { ...event, sig }
}

export const verifyEvent = async (event: Event) => {
    const pkBytes = hexToBytes(event.pubkey);
    const reSigned = await hashEvent(event);
    const checkId = reSigned.id;

    return (
        checkId === event.id &&
        verify(event.sig, event.id, pkBytes)
    );
}

export const defaultFilters: (pubkey: string) => Filter[] = (pubkey) => [
    { kinds: [1], "#p": [pubkey], },
    { kinds: [1], authors: [pubkey], },
];

