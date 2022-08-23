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

## Examples

### Creating + validating events

[validation.ts](examples/validation.ts ':include :type=code')

### Relays

[relay-connection.ts](examples/relay-connection.ts ':include :type=code')

### Messages &amp; Mailboxes

_TODO_

### Contacts

_TODO_

<style>
    tr > td:nth-child(1) {
        font-family: monospace;
    }

    tr > td:nth-child(2) {
        font-family: monospace;
    }
</style>
