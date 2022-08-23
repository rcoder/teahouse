export type { Event, Filter, Metadata, Nip05, Nip11 } from './gen/nostr';

// hand translated from `nostr.json` b/c trying to bundle json w/typescript libs
// has already burned more of my time than it deserves
export const schema = {
    event: {
        properties: {
            id        : { type: "string" },
            pubkey    : { type: "string" },
            created_at: { type: "float64" },
            kind      : { type: "uint16" },
            sig       : { type: "string" }
        },
        optionalProperties: {
            content : { type: "string" },
            tags: { elements: { elements: { type: "string" } } }
        }
    },
    filter: {
        optionalProperties: {
            ids    : { elements: { type: "string" } },
            authors: { elements: { type: "string" } },
            kinds  : { elements: { type: "uint16" } },
            "#e"   : { elements: { type: "string" } },
            "#p"   : { elements: { type: "string" } },
            since  : { type: "float64" },
            until  : { type: "float64" },
            limit  : { type: "uint32" }
        }
    },
    metadata: {
        optionalProperties: {
            name   : { type: "string" },
            about  : { type: "string" },
            picture: { type: "string" },
            nip05  : { type: "string" }
        }
    },
    nip05: {
        properties: {
            names: { values: { type: "string" } }
        }
    },
    nip11: {
        optionalProperties: {
            name       : { type: "string" },
            description: { type: "string" },
            pubkey     : { type: "string" },
            contact    : { type: "string" },
            software   : { type: "string" },
            version    : { type: "string" },
            supported_nips: { elements: { type: "uint16" } }
        }
    }
}

