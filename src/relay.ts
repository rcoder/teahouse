import type { Event, Filter } from './schema';
import schema from './schema/nostr.json';

import { type Schema, validate } from 'jtd';
import { ulid } from 'ulid';

import { WeakLRUCache } from 'weak-lru-cache';

export type RelayPool = {
    addFilter: (...filters: Filter[]) => string,
    conns: WebSocket[],
    connect: (url: string) => void,
    publish: (event: Event) => void,
    subscribe: (cb: SubscriptionCb) => () => void,
};

type SubscriptionCb = (event: Event) => Promise<void>;

export const mkPool: () => RelayPool = () => {
    const conns: WebSocket[] = [];
    const subscribers: Set<SubscriptionCb> = new Set();
    const recentEvents: WeakLRUCache<string, Event> = new WeakLRUCache();

    let lastEvent: Event;

    const connect = async (url: string) => {
        const socket = new WebSocket(url);
    
        return new Promise((accept, reject) => {
            socket.onopen = () => {
                conns.push(socket);
                accept(true);
            };

            socket.onerror = (err) => reject(err);

            socket.onmessage = (ev: MessageEvent) => {
                const [etype, _subId, event] = JSON.parse(ev.data);
                if (etype == "EVENT") {
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
        conns,
        connect,
        publish,
        subscribe,
    }
}

