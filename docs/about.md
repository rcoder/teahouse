---
title: About
---

# About Teahouse

Teahouse is a small library that helps you write clients for the [Nostr](https://github.com/nostr-protocol/nostr) decentralized message protocol.

Nostr is relatively new protocol and network designed to create decentralized, resilient applications based on compact "events" passed between clients and one or more relays. The [basic specification](https://github.com/nostr-protocol/nips/blob/master/01.md) fits on a few pages of text, and implementations are only required to implement a few basic operations (mainly hashing + signing JSON payloads according to the canonical form specific in NIP-01.

## Relays

Relays are message brokers and caches, not application servers. That means a few interesting things:

1. You can connect to arbitrarily many relays to get better coverage/availability of events, at the cost of more network traffic (incl. duplicate events).
2. Relays and clients to not have to mutually trust each other. No secrets are shared, and client can choose which relayed events to store or act on.

## Clients

Most client applications are focused on small, text-centric messages, but the protocol is relatively agnostic about payloads.

Nostr clients are responsible for maintaining a pool of relays to talk to; there is no single canonical or authoritative relay. The pool could contain one "primary" relay, or a wide range with different users/communities/content types represented.

## Related Projects

- [Nostr Improvement Proposals (NIPs)](https://github.com/nostr-protocol/nips)
- [nostr-tools](https://github.com/fiatjaf/nostr-tools)
- [awesome-nostr](https://github.com/aljazceru/awesome-nostr)

## FAQ

_TODO_
