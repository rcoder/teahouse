# teahouse: browser &lt;-&gt; nostr gateway

teahouse is a small library that helps you write clients for the [nostr](https://github.com/nostr-protocol/nostr) decentralized message protocol.

nostr is cool because it lets you wire up message-driven applications that send and receive messages via potentially many community-run "relay" servers, without those servers having to directly coordinate or trust (or be trusted by) end users.

that means anyone with a reachable network address can potentially run a relay and provide a little more capacity and reliability to the whole network. you can also run private relays, and host networks for invited users only.

there exists a reference implementation of a javascript nostr client: [nostr-tools](https://github.com/fiatjaf/nostr-tools) and it is a fine option. the design philosophy of this library is somewhat different -- types + schema-based validation from the get-go, focused on browser/web api environments -- and it adds functionality to make message handling a bit more efficient. (see "channel api" below.)

## channel api

> TODO
