import { type Event, type Message, mkPool, schema } from 'teahouse';

import jrpc from 'jsonrpc-lite';
import { type Schema, validate } from 'jtd';

import { AllEvents } from './channels';
import { type Handlers, type JrpcResponse, installHandlers } from './rpc';
import { extract } from '$lib/types';

const $ = (self as SharedWorkerGlobalScope);
const pool = mkPool();

/// internal 'jsonrpc' api
/// | method | params | note |
/// | --- | --- | --- |
/// | connect | url:string | add a relay at `url` (e.g., `wss://relay.nostr.example`) to our pool and returns a `RelayInfo` object if the relay hosts a nip11 doc |
/// | subscribe | filter:Filter | accepts a nostr filter, adds it to all of our open relay connections, and returns a subscription id |
/// | publish | event:Event | publish an authenticated (hashed + signed) event to all open relays |
const handlers: Handlers = {
    connect: async (req: jrpc.RequestObject) => {
        const url = req.params.url;

        if (url) {
            try {
                const relayInfo = pool.connect(url);
                $.send(jrpc.success(req.id, info));
            } catch (e) {
                $.send(jrpc.error(
                    req.id,
                    jrpc.JsonRpcError.internalError('failed to fetch relay data'),
                ));
            }
        } else {
            $.send(jrpc.error(
                req.id,
                jrpc.JsonRpcError.invalidParams('missing `url` param'),
            ));
    },
    subscribe: async (req: jrpc.RequestObjet) => {
        try {
            const filter = extract<Filter>(req.params.filter);
            const subId = ulid();

            pool.subscribe((event: Event) => {
                const msg = jrpc.notification('event', {
                    event,
                    subId,
                });

                $.send(msg);
                AllEvents.send(msg);
            }, subId, filter);

            $.send(jrpc.success(req.id, {
                msg: 'subscribed',
                id: subId,
            }));
        } catch (e) {
            $.send(jrpc.JsonRpcError.invalidParams(req.id, e));
        }
    },
    publish: async (req: jrpc.RequestObject) => {
        try{
            const event = extract<Event>(req.params.event);
            pool.publish(event);

            const msg = jrpc.success(req.id, {
                msg: 'published',
                id: event.id,
            }));

            $.send(msg);
            AllEvents.send(msg);
        } catch (e) {
            $.send(jrpc.JsonRpcError.invalidParams(req.id, e));
        }
    },
}

installHandlers($, handlers);
