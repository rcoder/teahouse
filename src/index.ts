export {
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

export { type Contact, resolver } from './contact';

export { fetchRelayInfo, mkPool, relayInfoUrl } from './relay';

export {
    type Event,
    type Filter,
    type Metadata,
    type Nip05,
    type Nip11,
} from './schema/gen/nostr';

import schema from './schema/nostr.json';
export { schema };

import crossFetch from 'cross-fetch';
export type Fetch = typeof crossFetch;
