---
title: API
---

# Teahouse API

## General Protocol

### Schema

The wire format for Nostr events and filters is described in the <abbr name="JSON Type Definitions">JTD</abbr> definitions in [nostr.json](../src/schema/nostr.json) and exported through the `schema` module.

You can import the following types:

| Name | Fields | Note | NIP(s) |
| --- | --- | --- | --- |
| Event | id, pubkey, created_at, kind, sig, content, tags | Core event type passed between all clients and relays | 1 |
| Filter | ids, authors, kinds, #e, #p, since, until, limit | | 1 |
| Metadata | name, about, picture, nip05 | Client metadata plus NIP-05 name verification | 1, 5 |
| Nip05 | names | Response payload for NIP-05 name lookups | 5 |
| Nip11 | name, description, pubkey, contact, software, version, supported_nips | Response payload for relay info document as defined in NIP-11 | 11 |

You can validate an arbitrary JSON object against the relevant schema as follows:

```ts
import schema from 'teahouse/schema/nostr.json';
import { validate, type Schema } from 'jtd';

const myEvent = { ... }
const errors = validate(schema.event as Schema, myEvent);

if (errors.length == 0) {
    // message validated, so go ahead
}
```

### Creating events

```ts
import {
    bytesToHex,
    getPublicKey,
    randomKeypair,
    signEvent,
    verifyEvent
} from 'teahouse';

const keys = randomKeypair();

// signEvent generates `id` (the SHA-256 hash of the canonicalized
// event) and `sig` (schnorr signature of `id`)
const ev = signEvent({
    kind: EventKind.Text,
    content: 'just setting up my nostr',
    created_at: Date.now(),
    tags: [],
    pubkey: keys.pk
}, myKeypair);

assert(verifyEvent(ev));

```

## Relays

```ts

import { defaultFilters, mkPool } from 'teahouse';

const pool = mkPool();
const relayInfo = await pool.connect('wss://relay.example.com');

const keys = randomKeypair();
const filters = defaultFilters(keys.pk);

const subId = pool.subscribe((ev: Event) => {
    console.log({ ev });
}, ...filters)

const ev = signEvent({
    ...
});

pool.publish(ev);
```

## Messages &amp; Mailboxes

_TODO_

## Contacts

_TODO_

<style>
    tr > td:nth-child(1) {
        font-family: monospace;
    }

    tr > td:nth-child(2) {
        font-family: monospace;
    }
</style>