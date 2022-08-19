export {
    type Keypair,
    defaultFilters,
    EventKind,
    keypair,
    randomKeypair,
    signEvent,
    verifyEvent,
} from './nostr';

export {
    type Event,
    type Filter,
    type Metadata,
    type Nip05,
    type Nip11,
} from './schema/gen/nostr';

import schema from './schema/nostr.json';
export { schema };

export {
    type Message,
    type Mailbox,
    Annotation,
    mkMailbox,
} from './mailbox';

export { type Contact, resolver } from './contact';

export { fetchRelayInfo, mkPool, relayInfoUrl } from './relay';
