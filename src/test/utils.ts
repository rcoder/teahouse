import {
    type Event,
    type Keypair,
    bytesToHex,
    EventKind,
    getPublicKey,
    signEvent
} from '..';

import { Either } from 'prelude-ts';

import schema from '../schema/nostr.json';
import { type Schema, validate } from 'jtd';

export const stdSk = '7f2c59ec89ec1bdb3b0ba760d747ae3ec3402afeaf227d27883f71eb9a56dde6';
export const stdTs = new Date(2022, 1, 1);

export const stdKeypair: Keypair = {
    sk: stdSk,
    pk: bytesToHex(getPublicKey(stdSk))
};

export const mkEvent: (content?: string) => Promise<Event> =
    async (content = '') => await signEvent({
        kind: EventKind.Text,
        content,
        pubkey: stdKeypair.pk,
        tags: [['#p', stdKeypair.pk]],
        created_at: stdTs.getTime(),
    }, stdKeypair);

export const validateEvent = (event: unknown) => {
    const errors = validate(schema.event as Schema, event);
    return (errors.length === 0) ? Either.left(event) : Either.right(errors);
}
