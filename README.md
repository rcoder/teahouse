# teahouse: browser &lt;-&gt; nostr gateway

teahouse is a small library that helps you write clients for the [nostr](https://github.com/nostr-protocol/nostr) decentralized message protocol.

nostr is cool because it lets you wire up message-driven applications that send and receive messages via potentially many community-run "relay" servers, without those servers having to directly coordinate or trust (or be trusted by) end users.

that means anyone with a reachable network address can potentially run a relay and provide a little more capacity and reliability to the whole network. you can also run private relays, and host networks for invited users only.

## usage

see [`examples/feed.js`](examples/feed.js) for a simple example. more api docs to come.

## faq

<dl>

<dt>why use this instead of [nostr-tools](https://github.com/fiatjaf/nostr-tools)?
</dt>
<dd>nostr-tools is the original option for node/browser nostr clients and still has the best feature + extension coverage. teahouse is designed a little differently: it starts with a wire-format schema, and builds a native typescript interface up from there. i've also tried to build out test coverage as i go, even where that makes interfaces a little messier (see the `RelayPool#mkPool` constructor for an example)</dd>

