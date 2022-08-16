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

import { fetchRelayInfo, mkPool, relayInfoUrl } from './relay';

import {
    type Event,
    type Filter,
    type Metadata,
    type Nip05,
    type Nip11,
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
    fetchRelayInfo,
    getPublicKey,
    hexToBytes,
    mkPool,
    randomPrivateKey,
    relayInfoUrl,
    schema,
    signEvent,
    verifyEvent,
};
