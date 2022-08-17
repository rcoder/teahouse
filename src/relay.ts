import type { Event, Filter, Nip11 } from './schema';
import schema from './schema/nostr.json';

import { type Schema, validate } from 'jtd';
import { ulid } from 'ulid';

import fetch from 'cross-fetch';

import { WeakLRUCache } from 'weak-lru-cache';
import WebSocket from 'isomorphic-ws';

export type RelayPool = {
    addFilter: (...filters: Filter[]) => string,
    close: () => void,
    conns: WebSocket[],
    connect: (url: string) => Promise<Nip11|undefined>,
    publish: (event: Event) => void,
    subscribe: (cb: SubscriptionCb) => () => void,
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
    const subscribers: Set<SubscriptionCb> = new Set();
    const recentEvents: WeakLRUCache<string, Event> = new WeakLRUCache();

    let lastEvent: Event;

    const close = () => {
        for (const sock of conns) {
            sock.close();
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

                        const errors = validate(schema.event as Schema, event);

                        if (errors.length == 0) {
                            lastEvent = event;

                            if (recentEvents.getValue(event.id) === undefined) {
                                for (const sub of subscribers) {
                                    sub(event);
                                }
                            }

                            recentEvents.setValue(event.id, event);
                        }
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

    const subscribe = (cb: SubscriptionCb) => {
        subscribers.add(cb);
        cb(lastEvent);
        return () => subscribers.delete(cb);
    }

    const addFilter = (...filters: Filter[]) => {
        const subId = ulid();

        for (const socket of conns) {
            socket.send(JSON.stringify(["REQ", subId, ...filters]));
        }

        return subId;
    }

    const publish = (event: Event) => {
        for (const conn of conns) {
            conn.send(JSON.stringify(["EVENT", event]));
        }
    }

    return {
        addFilter,
        close,
        conns,
        connect,
        publish,
        subscribe,
    }
}

