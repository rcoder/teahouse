// src/nostr.ts
import { schnorr, utils } from "@noble/secp256k1";
var { bytesToHex, hexToBytes, sha256, randomPrivateKey } = utils;
var { getPublicKey, sign, verify } = schnorr;
var EventKind = /* @__PURE__ */ ((EventKind2) => {
  EventKind2[EventKind2["Metadata"] = 0] = "Metadata";
  EventKind2[EventKind2["Text"] = 1] = "Text";
  EventKind2[EventKind2["RelayRec"] = 2] = "RelayRec";
  EventKind2[EventKind2["Contacts"] = 3] = "Contacts";
  EventKind2[EventKind2["DM"] = 4] = "DM";
  EventKind2[EventKind2["Deleted"] = 5] = "Deleted";
  return EventKind2;
})(EventKind || {});
var keypair = (sk) => {
  return {
    sk,
    pk: getPublicKey(sk)
  };
};
var randomKeypair = () => keypair(bytesToHex(randomPrivateKey()));
var signEvent = async (event, keys) => {
  const signingForm = [
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content
  ];
  const signingPayload = JSON.stringify(signingForm);
  const id = bytesToHex(await sha256(new TextEncoder().encode(signingPayload)));
  const sig = bytesToHex(await sign(id, keys.sk));
  const signed = {
    ...event,
    id,
    sig
  };
  return signed;
};
var verifyEvent = (event) => {
  const pkBytes = hexToBytes(event.pubkey);
  return verify(event.sig, event.id, pkBytes);
};
var defaultFilters = (pubkey) => [
  { kinds: [1], "#p": [pubkey] },
  { kinds: [1], authors: [pubkey] }
];

// src/schema/nostr.json
var nostr_default = {
  event: {
    properties: {
      id: { type: "string" },
      pubkey: { type: "string" },
      created_at: { type: "float64" },
      kind: { type: "uint16" },
      sig: { type: "string" }
    },
    optionalProperties: {
      content: { type: "string" },
      tags: { elements: { elements: { type: "string" } } }
    }
  },
  filter: {
    optionalProperties: {
      ids: { elements: { type: "string" } },
      authors: { elements: { type: "string" } },
      kinds: { elements: { type: "uint16" } },
      "#e": { elements: { type: "string" } },
      "#p": { elements: { type: "string" } },
      since: { type: "float64" },
      until: { type: "float64" },
      limit: { type: "uint32" }
    }
  },
  metadata: {
    optionalProperties: {
      name: { type: "string" },
      about: { type: "string" },
      picture: { type: "string" },
      nip05: { type: "string" }
    }
  },
  nip05: {
    properties: {
      names: { values: { type: "string" } }
    }
  },
  nip11: {
    optionalProperties: {
      name: { type: "string" },
      description: { type: "string" },
      pubkey: { type: "string" },
      contact: { type: "string" },
      software: { type: "string" },
      version: { type: "string" },
      supported_nips: { elements: { type: "uint16" } }
    }
  }
};

// src/mailbox.ts
var Annotation = /* @__PURE__ */ ((Annotation2) => {
  Annotation2[Annotation2["Seen"] = 0] = "Seen";
  Annotation2[Annotation2["Read"] = 1] = "Read";
  Annotation2[Annotation2["Muted"] = 2] = "Muted";
  Annotation2[Annotation2["Pinned"] = 3] = "Pinned";
  return Annotation2;
})(Annotation || {});
var mkMessage = (event) => ({
  event,
  received: new Date(),
  annotations: /* @__PURE__ */ new Set()
});
var mkMailbox = (pool) => {
  const mailbox = /* @__PURE__ */ new Map();
  const openSubs = [];
  const index = async (msg, related = false, timeout) => {
    const primaryId = msg.event.id;
    mailbox.set(msg.event.id, msg);
    if (related) {
      const receipt = pool.subscribe(async (e) => {
        if (!mailbox.has(e.id)) {
          mailbox.set(e.id, mkMessage(e));
        }
      }, void 0, { "#e": [primaryId] });
      openSubs.push(receipt);
      if (timeout) {
        setTimeout(receipt, timeout);
      }
    }
  };
  const find = async (id, related = false, timeout) => {
    if (mailbox.has(id)) {
      return Promise.resolve(mailbox.get(id));
    } else {
      const q = await pool.query({ ids: [id] }, timeout);
      const event = await q.query;
      const msg = mkMessage(event);
      await index(msg, related, timeout);
      return msg;
    }
  };
  const close = () => {
    for (const receipt of openSubs) {
      receipt();
    }
  };
  return { index, find, close };
};

// src/contact.ts
import { validate } from "jtd";
import fetch from "cross-fetch";
import { WeakLRUCache } from "weak-lru-cache";
var parseNip05Name = (alias) => {
  let [_, local, domain] = alias.match(/^([-.\w]+)@([-.\w]+)/) || [];
  return local && domain && { local, domain };
};
var nip05Url = (name) => {
  let { local, domain } = name;
  if (local && domain) {
    local = encodeURIComponent(local);
    domain = encodeURIComponent(domain);
    const url = `https://${domain}/.well-known/nostr.json?name=${local}`;
    return new URL(url);
  } else {
    return void 0;
  }
};
var resolver = () => {
  let cache;
  const reset = () => {
    cache = new WeakLRUCache();
  };
  const check = async (event) => {
    const meta = JSON.parse(event.content || "");
    const errors = validate(nostr_default.metadata, meta);
    if (errors.length === 0) {
      if (cache.has(meta.nip05)) {
        return cache.getValue(meta.nip05);
      }
      const n05Name = parseNip05Name(meta.nip05);
      if (n05Name) {
        const url = nip05Url(n05Name);
        if (url) {
          const response = await fetch(url);
          if (response.ok) {
            const ident = await response.json();
            const check2 = ident[n05Name.local] == event.pubkey;
            cache.setValue(meta.nip05, check2);
            return ident[n05Name.local] == event.pubkey;
          }
        }
      }
    }
    return false;
  };
  reset();
  return { check, reset };
};

// src/relay.ts
import { validate as validate2 } from "jtd";
import { ulid } from "ulid";
import fetch2 from "cross-fetch";
import { WeakLRUCache as WeakLRUCache2 } from "weak-lru-cache";
import WebSocket from "isomorphic-ws";
var relayInfoUrl = (wsUrl) => new URL(`https://${new URL(wsUrl).host}/`);
var fetchRelayInfo = async (url) => {
  let response = Promise.resolve(void 0);
  try {
    const fetchResult = await fetch2(relayInfoUrl(url), {
      headers: {
        accept: "application/nostr+json"
      }
    });
    if (fetchResult.ok) {
      response = await fetchResult.json();
    }
  } catch (e) {
  }
  return response;
};
var mkSocket = (url) => new WebSocket(url);
var mkPool = (wsFactory = mkSocket) => {
  const conns = /* @__PURE__ */ new Map();
  const rInfo = /* @__PURE__ */ new Map();
  const subscribers = {
    named: /* @__PURE__ */ new Map(),
    global: /* @__PURE__ */ new Set()
  };
  const recentEvents = new WeakLRUCache2();
  let lastEvent;
  const activeRelays = () => [...conns.values()].length;
  const close = () => {
    for (const sock of conns.values()) {
      sock.close();
    }
  };
  const handleEvent = (subId, event) => {
    const errors = validate2(nostr_default.event, event);
    if (errors.length == 0) {
      if (recentEvents.getValue(event.id) === void 0) {
        lastEvent = event;
        const recipients = [...subscribers.global];
        const named = subscribers.named.get(subId);
        if (named)
          recipients.push(named);
        for (let recip of recipients) {
          recip(event);
        }
        recentEvents.setValue(event.id, event);
      }
    }
  };
  const connect = async (url, fetchInfo = false) => {
    const sock = wsFactory(url);
    return new Promise((accept, reject) => {
      sock.onopen = async () => {
        if (fetchInfo) {
          let info = void 0;
          info = await fetchRelayInfo(url);
          if (info)
            rInfo.set(url, info);
          conns.set(url, sock);
          accept(info);
        }
      };
      sock.onerror = (err) => reject(err);
      sock.onmessage = (ev) => {
        const [etype, ...params] = JSON.parse(ev.data);
        switch (etype) {
          case "EVENT":
            const subId = params[0];
            const event = params[1];
            handleEvent(subId, event);
            break;
          case "NOTIFY":
            break;
          case "EOSE":
            break;
        }
      };
    });
  };
  const relayInfo = async (url) => {
    let info = rInfo.get(url);
    if (!info) {
      info = await fetchRelayInfo(url);
      if (info)
        rInfo.set(url, info);
    }
    return info;
  };
  const sendAll = (msg) => {
    for (const sock of conns.values()) {
      sock.send(JSON.stringify(msg));
    }
  };
  const subscribe = (cb, subId, ...filters) => {
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
        try {
          sendAll(["CLOSE", subId]);
        } catch {
        }
      }
    };
    receipt.subId = subId;
    return receipt;
  };
  const publish = (event) => {
    for (const sock of conns.values()) {
      sock.send(JSON.stringify(["EVENT", event]));
    }
  };
  const query = (filter, timeout) => {
    const subId = ulid();
    let receipt = void 0;
    const query2 = new Promise((accept, reject) => {
      const timer = timeout && setTimeout(() => {
        if (receipt)
          receipt();
        reject(new Error("timeout reached"));
      }, timeout);
      receipt = subscribe(async (event) => {
        setTimeout(() => {
          clearTimeout(timer);
          receipt && receipt();
          accept(event);
        }, 0);
      }, subId, filter);
    });
    return { subId, query: query2 };
  };
  return {
    activeRelays,
    close,
    conns,
    connect,
    publish,
    relayInfo,
    query,
    subscribe
  };
};
export {
  Annotation,
  EventKind,
  defaultFilters,
  fetchRelayInfo,
  keypair,
  mkMailbox,
  mkPool,
  randomKeypair,
  relayInfoUrl,
  resolver,
  nostr_default as schema,
  signEvent,
  verifyEvent
};
