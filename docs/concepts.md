# Teahouse Basic Concepts

## Nostr standards

### Relays

Relays are message brokers and caches, not application servers. That means a few interesting things:

1. You can connect to arbitrarily many relays to get better coverage/availability of events, at the cost of more network traffic (incl. duplicate events).
2. Relays and clients do **not** have to mutually trust each other. No secrets are shared, and client can choose which relayed events to store or act on.

### Clients

Most client applications are focused on small, text-centric messages, but the protocol is relatively agnostic about payloads.

Nostr clients are responsible for maintaining a pool of relays to talk to; there is no single canonical or authoritative relay. The pool could contain one "primary" relay, or a wide range with different users/communities/content types represented.

### Filters

A filter is just a search query that can run over the core fields in an event. In addition to the normal wire-protocol filter generation and validation, Teahouse supports local evaluation of filters so they can be applied or previewed against events stored on the client, or reused directly in a relay implementation.

### NIPs

The core Nostr protocol is extremely limited: just text notes and user metadata, plus filters and subscriptions. There are no afforances for other event types, encryption, or tag types aside from `#e` (related event) and `#p` (referenced profile).

## Teahouse-specific

### Messages & Mailboxes

Nostr is a very lightweight protocol with no state preserved between relay connections. Subscriptions persist as long as a connection is open unless explicitly closed, but there's no guarantee that the same filters will return all the same events in a future session. (Ex.: may relays cap the total number, age, or size of messages they store. You could see messages "disappear" when closing + re-opening your client.)

In addition, events themselves have no mutable state. Some types of metadata or state can be built atop the basic events + tagging model (e.g., [NIP-25](https://github.com/nostr-protocol/nips/blob/master/25.md), an up/down vote "reaction" event type) but others (read/unread flag, profile mute, etc.) require client-side storage.

The `Message` type is an event wrapper that lets you attach annotations to events, and a `Mailbox` wraps a collection of messages in a cache and simple query interface.