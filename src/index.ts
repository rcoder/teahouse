import {
    type Keypair,
    type Message,
    Annotation,
    bytesToHex,
    defaultFilters,
    EventKind,
    getPublicKey,
    hexToBytes,
    randomPrivateKey,
    signEvent,
    verifyEvent,
} from './nostr';

import { mkPool } from './relay';

import {
    type Event,
    type Filter,
    type Metadata,
} from './schema/gen/nostr';

import schema from './schema/nostr.json';

export {
    type Event,
    type Filter,
    type Metadata,
    type Keypair,
    type Message,
    Annotation,
    bytesToHex,
    defaultFilters,
    EventKind,
    getPublicKey,
    hexToBytes,
    mkPool,
    randomPrivateKey,
    schema,
    signEvent,
    verifyEvent,
};
