import type { Event, Filter, Nip11 } from './schema';
import schema from './schema/nostr.json';

import { type Schema, validate } from 'jtd';
import { ulid } from 'ulid';

import fetch from 'cross-fetch';

import { WeakLRUCache } from 'weak-lru-cache';
import WebSocket from 'isomorphic-ws';

export type Subscription = {
    (): void,
    subId?: string,
};

export type Query = {
    subId: string,
    query: Promise<Event>,
};

export type RelayPool = {
    close: () => void,
    connect: (url: string, fetchInfo?: boolean) => Promise<Nip11|undefined>,
    activeRelays: () => number,
    publish: (event: Event) => void,
    query: (filter: Filter, timeout?: number) => Query,
    relayInfo: (url: string) => Promise<Nip11|undefined>,
    subscribe: (cb: SubscriptionCb, subId?: string, ...filters: Filter[]) => Subscription,
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
        // TODO: this function should really return an `Either`
        // or re-throw, probably
        //console.debug(`fetchRelayInfo`, { e });
    }

    return response;
}

const mkSocket = (url: string|URL) => new WebSocket(url);

export const mkPool: (wsFactory?: typeof mkSocket) => RelayPool = (wsFactory = mkSocket) => {
    const conns: Map<string, WebSocket> = new Map();
    const rInfo: Map<string, Nip11> = new Map();

    const subscribers = {
        named: new Map<string, SubscriptionCb>(),
        global: new Set<SubscriptionCb>,
    };

    const recentEvents: WeakLRUCache<string, Event> = new WeakLRUCache();

    let lastEvent: Event;

    const activeRelays = () => [...conns.values()].length;

    const close = () => {
        for (const sock of conns.values()) {
            sock.close();
        }
    }

    const handleEvent = (subId: string, event: Event) => {
        const errors = validate(schema.event as Schema, event);
        if (errors.length == 0) {
            if (recentEvents.getValue(event.id) === undefined) {
                lastEvent = event;
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

    const connect = async (url: string, fetchInfo = false) => {
        const sock = wsFactory(url);
    
        return new Promise<Nip11|undefined>((accept, reject) => {
            sock.onopen = async () => {
                if (fetchInfo) {
                    let info: Nip11|undefined = undefined;
                    info = await fetchRelayInfo(url);
                    if (info) rInfo.set(url, info);
                    conns.set(url, sock);
                    accept(info);
                } else {
                    accept(undefined);
                }
            };

            sock.onerror = (err: unknown) => reject(err);

            // there are too many types of `Event` in the web API
            // standards
            sock.onmessage = ((mev: MessageEvent) => {
                const [etype, ...params] = JSON.parse(mev.data);

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
            }) as any;
        });
    };

    const relayInfo = async (url: string) => {
        let info = rInfo.get(url);

        if (!info) {
            info = await fetchRelayInfo(url);
            if (info) rInfo.set(url, info);
        }

        return info;
    }

    const sendAll = (msg: unknown) => {
        for (const sock of conns.values()) {
            sock.send(JSON.stringify(msg));
        }
    }

    const subscribe = (cb: SubscriptionCb, subId?: string, ...filters: Filter[]) => {
        if (filters.length > 0) {
            subId = subId || ulid();
            sendAll(["REQ", subId, ...filters]);
            subscribers.named.set(subId, cb);
        } else {
            subscribers.global.add(cb);
            cb(lastEvent);
        }

        const receipt = () => {
            subscribers.global.delete(cb);
            if (subId) {
                subscribers.named.delete(subId);
                try { sendAll(["CLOSE", subId]); } catch {}
            }
        };

        receipt.subId = subId;

        return receipt;
    }

    const publish = (event: Event) => {
        for (const sock of conns.values()) {
            sock.send(JSON.stringify(["EVENT", event]));
        }
    }

    const query: (filter: Filter, timeout?: number) => Query =
        (filter, timeout) => {
            const subId = ulid();

            let receipt: Subscription|undefined = undefined;

            const query = new Promise<Event>((accept, reject) => {
                const timer = timeout && setTimeout(() => {
                    if (receipt) receipt();
                    reject(new Error("timeout reached"));
                }, timeout);

                receipt = subscribe(async (event: Event) => {
                    setTimeout(() => {
                        clearTimeout(timer);
                        receipt && receipt();
                        accept(event);
                    }, 0);
                }, subId, filter);
            });

            return { subId, query };
        };

    return {
        activeRelays,
        close,
        conns,
        connect,
        publish,
        relayInfo,
        query,
        subscribe,
    }
}

