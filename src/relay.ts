import type { Event, Filter, Nip11 } from './schema';
import schema from './schema/nostr.json';

import { type Schema, validate } from 'jtd';
import { ulid } from 'ulid';

import fetch from 'cross-fetch';

import { WeakLRUCache } from 'weak-lru-cache';
import WebSocket from 'isomorphic-ws';

type Subscription = {
    (): void,
    subId?: string,
};

export type RelayPool = {
    close: () => void,
    conns: WebSocket[],
    connect: (url: string) => Promise<Nip11|undefined>,
    publish: (event: Event) => void,
    subscribe: (cb: SubscriptionCb, ...filters: Filter[]) => Subscription,
};

type SubscriptionCb = (event: Event) => Promise<void>;

export const relayInfoUrl = (wsUrl: string) => new URL(`https://${new URL(wsUrl).host}/`);

// fetch NIP-11 info for one relay, if available
export const fetchRelayInfo = async (url: string) => {
    let response = Promise.resolve(undefined);

    try {
        const fetchResult = await fetch(relayInfoUrl(url), {
            headers: {
                accept: 'application/nostr+json'
            }
        });

        if (fetchResult.ok) {
            response = await fetchResult.json();
        }
    } catch (e) {
        console.error(`fetchRelayInfo`, { e });
        // TODO: this function should really return an `Either`
        // or re-throw, probably?
    }

    return response;
}

const mkSocket = (url: string) => new WebSocket(url);

export const mkPool: (wsFactory: typeof WebSocket) => RelayPool = ( wsFactory = mkSocket) => {
    const conns: WebSocket[] = [];

    const subscribers = {
        named: new Map<string, SubscriptionCb>(),
        global: new Set<SubscriptionCb>,
    };

    const recentEvents: WeakLRUCache<string, Event> = new WeakLRUCache();

    let lastEvent: Event;

    const close = () => {
        for (const sock of conns) {
            sock.close();
        }
    }

    const handleEvent = (subId: string, event: Event) => {
        const errors = validate(schema.event as Schema, event);
        if (errors.length == 0) {
            lastEvent = event;
            if (recentEvents.getValue(event.id) === undefined) {
                const recipients = [...subscribers.global];
                const named = subscribers.named.get(subId);
                if (named) recipients.push(named);

                for (let recip of recipients) {
                    recip(event);
                }

                recentEvents.setValue(event.id, event);
            }
        }
    }

    const connect = async (url: string) => {
        const socket = wsFactory(url);
    
        return new Promise<Nip11|undefined>((accept, reject) => {
            socket.onopen = async () => {
                conns.push(socket);
                const relayInfo = await fetchRelayInfo(url);
                accept(relayInfo);
            };

            socket.onerror = (err: unknown) => reject(err);

            socket.onmessage = (ev: MessageEvent) => {
                const [etype, ...params] = JSON.parse(ev.data);

                switch (etype) {
                    case "EVENT":
                        const subId = params[0];
                        const event = params[1];
                        handleEvent(subId, event);
                        break;
                    case "NOTIFY":
                        // TODO
                        break;
                    case "EOSE":
                        // TODO
                        break;
                }
            }
        });
    };

    const sendAll = (msg: unknown) => {
        for (const socket of conns) {
            socket.send(JSON.stringify(msg));
        }
    }

    const subscribe = (cb: SubscriptionCb, ...filters: Filter[]) => {
        let subId: string | undefined = undefined;

        if (filters.length > 0) {
            subId = ulid();
            sendAll(["REQ", subId, ...filters]);
            subscribers.named.set(subId, cb);
        } else {
            subscribers.global.add(cb);
        }

        cb(lastEvent);

        const receipt = () => {
            subscribers.global.delete(cb);
            if (subId) {
                subscribers.named.delete(subId);
                sendAll(["CLOSE", subId]);
            }
        };

        receipt.subId = subId;

        return receipt;
    }

    const publish = (event: Event) => {
        for (const conn of conns) {
            conn.send(JSON.stringify(["EVENT", event]));
        }
    }

    return {
        close,
        conns,
        connect,
        publish,
        subscribe,
    }
}

