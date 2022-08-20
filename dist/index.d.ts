import WebSocket from 'isomorphic-ws';

interface Event {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    sig: string;
    content?: string;
    tags?: Array<Array<string>>;
}
interface Filter {
    ids?: Array<string>;
    authors?: Array<string>;
    kinds?: Array<number>;
    "#e"?: Array<string>;
    "#p"?: Array<string>;
    since?: number;
    until?: number;
    limit?: number;
}
interface Metadata {
    name?: string;
    about?: string;
    picture?: string;
    nip05?: string;
}
interface Nip05 {
    names: Record<string, string>;
}
interface Nip11 {
    name?: string;
    description?: string;
    pubkey?: string;
    contact?: string;
    software?: string;
    version?: string;
    supported_nips?: Array<number>;
}

declare enum EventKind {
    Metadata = 0,
    Text = 1,
    RelayRec = 2,
    Contacts = 3,
    DM = 4,
    Deleted = 5
}
declare type Keypair = {
    pk: string;
    sk: string;
};
declare const keypair: (sk: string) => {
    sk: string;
    pk: string;
};
declare const randomKeypair: () => {
    sk: string;
    pk: string;
};
declare type PresignEvent = Omit<Event, 'id' | 'sig'>;
declare type SignedEvent = PresignEvent & {
    id: string;
};
declare const hashEvent: (event: PresignEvent) => Promise<SignedEvent>;
declare const signEvent: (event: SignedEvent, keys: Keypair) => Promise<{
    sig: string;
    pubkey: string;
    created_at: number;
    kind: number;
    content?: string | undefined;
    tags?: string[][] | undefined;
    id: string;
}>;
declare const verifyEvent: (event: Event) => Promise<boolean>;
declare const defaultFilters: (pubkey: string) => Filter[];

var event = {
	properties: {
		id: {
			type: "string"
		},
		pubkey: {
			type: "string"
		},
		created_at: {
			type: "float64"
		},
		kind: {
			type: "uint16"
		},
		sig: {
			type: "string"
		}
	},
	optionalProperties: {
		content: {
			type: "string"
		},
		tags: {
			elements: {
				elements: {
					type: "string"
				}
			}
		}
	}
};
var filter = {
	optionalProperties: {
		ids: {
			elements: {
				type: "string"
			}
		},
		authors: {
			elements: {
				type: "string"
			}
		},
		kinds: {
			elements: {
				type: "uint16"
			}
		},
		"#e": {
			elements: {
				type: "string"
			}
		},
		"#p": {
			elements: {
				type: "string"
			}
		},
		since: {
			type: "float64"
		},
		until: {
			type: "float64"
		},
		limit: {
			type: "uint32"
		}
	}
};
var metadata = {
	optionalProperties: {
		name: {
			type: "string"
		},
		about: {
			type: "string"
		},
		picture: {
			type: "string"
		},
		nip05: {
			type: "string"
		}
	}
};
var nip05 = {
	properties: {
		names: {
			values: {
				type: "string"
			}
		}
	}
};
var nip11 = {
	optionalProperties: {
		name: {
			type: "string"
		},
		description: {
			type: "string"
		},
		pubkey: {
			type: "string"
		},
		contact: {
			type: "string"
		},
		software: {
			type: "string"
		},
		version: {
			type: "string"
		},
		supported_nips: {
			elements: {
				type: "uint16"
			}
		}
	}
};
var nostr = {
	event: event,
	filter: filter,
	metadata: metadata,
	nip05: nip05,
	nip11: nip11
};

declare type Subscription = {
    (): void;
    subId?: string;
};
declare type Query = {
    subId: string;
    query: Promise<Event>;
};
declare type RelayPool = {
    close: () => void;
    connect: (url: string, fetchInfo?: boolean) => Promise<Nip11 | undefined>;
    activeRelays: () => number;
    publish: (event: Event) => void;
    query: (filter: Filter, timeout?: number) => Query;
    relayInfo: (url: string) => Promise<Nip11 | undefined>;
    subscribe: (cb: SubscriptionCb, subId?: string, ...filters: Filter[]) => Subscription;
};
declare type SubscriptionCb = (event: Event) => Promise<void>;
declare const relayInfoUrl: (wsUrl: string) => URL;
declare const fetchRelayInfo: (url: string) => Promise<undefined>;
declare const mkPool: (wsFactory: typeof WebSocket) => RelayPool;

declare enum Annotation {
    Seen = 0,
    Read = 1,
    Muted = 2,
    Pinned = 3
}
declare type Message = {
    event: Event;
    received: Date;
    annotations: Set<Annotation>;
};
declare type Mailbox = {
    index: (msg: Message, related: boolean, timeout?: number) => Promise<void>;
    find: (id: string, related?: boolean, timeout?: number) => Promise<Message | undefined>;
    close: () => void;
};
declare const mkMailbox: (pool: RelayPool) => Mailbox;

declare type Contact = {
    label: string;
    meta: Metadata[];
    keypair?: Keypair;
    pinned?: Event[];
    comment?: string;
};
declare type IdentResolver = {
    check: (event: Event) => Promise<boolean>;
    reset: () => void;
};
declare const resolver: () => IdentResolver;

export { Annotation, Contact, Event, EventKind, Filter, Keypair, Mailbox, Message, Metadata, Nip05, Nip11, defaultFilters, fetchRelayInfo, hashEvent, keypair, mkMailbox, mkPool, randomKeypair, relayInfoUrl, resolver, nostr as schema, signEvent, verifyEvent };
