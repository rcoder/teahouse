import { type Keypair } from './nostr';
import { type Event, type Metadata } from './schema/gen/nostr';

import schema from './schema/nostr.json';
import { type Schema, validate } from 'jtd';

import fetch from 'cross-fetch';
import { WeakLRUCache } from 'weak-lru-cache';

export type Contact = {
    label: string,
    meta: Metadata[],
    keypair?: Keypair,
    pinned?: Event[],
    comment?: string,
};

type Nip05Name = {
    local: string,
    domain: string,
};

export const parseNip05Name = (alias: string) => {
    let [_, local, domain] = alias.match(/^([-.\w]+)@([-.\w]+)/) || [];

    return local && domain && { local, domain };
}

export const nip05Url = (name: Nip05Name) => {
    let { local, domain } = name;

    if (local && domain) {
        local = encodeURIComponent(local);
        domain = encodeURIComponent(domain);
        const url = `https://${domain}/.well-known/nostr.json?name=${local}`;
        return new URL(url);
    } else {
        return undefined;
    }
}

type IdentResolver = {
    check: (event: Event) => Promise<boolean>;
    reset: () => void;
};

export const resolver: () => IdentResolver = () => {
    let cache: WeakLRUCache<string, boolean>;

    const reset = () => {
        cache = new WeakLRUCache<string, boolean>();
    };

    const check = async (event: Event) => {
        const meta = JSON.parse(event.content||'');
        const errors = validate(schema.metadata as Schema, meta);

        if (errors.length === 0) {
            if (cache.has(meta.nip05)) {
                return cache.getValue(meta.nip05) as boolean;
            }

            const n05Name = parseNip05Name(meta.nip05);

            if (n05Name) {
                const url = nip05Url(n05Name);

                if (url) {
                    const response = await fetch(url);
                    if (response.ok) {
                        const ident = await response.json();
                        const check = ident[n05Name.local] == event.pubkey;
                        cache.setValue(meta.nip05, check);
                        return (ident[n05Name.local] == event.pubkey);
                    }
                }
            }
        }

        return false;
    }

    reset();

    return { check, reset };
}
