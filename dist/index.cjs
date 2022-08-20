"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Annotation: () => Annotation,
  EventKind: () => EventKind,
  defaultFilters: () => defaultFilters,
  fetchRelayInfo: () => fetchRelayInfo,
  hashEvent: () => hashEvent,
  keypair: () => keypair,
  mkMailbox: () => mkMailbox,
  mkPool: () => mkPool,
  randomKeypair: () => randomKeypair,
  relayInfoUrl: () => relayInfoUrl,
  resolver: () => resolver,
  schema: () => nostr_default,
  signEvent: () => signEvent,
  verifyEvent: () => verifyEvent
});
module.exports = __toCommonJS(src_exports);

// src/nostr.ts
var import_secp256k1 = require("@noble/secp256k1");
var { bytesToHex, hexToBytes, sha256, randomPrivateKey } = import_secp256k1.utils;
var { getPublicKey, sign, verify } = import_secp256k1.schnorr;
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
    pk: bytesToHex(getPublicKey(sk))
  };
};
var randomKeypair = () => keypair(bytesToHex(randomPrivateKey()));
var hashEvent = async (event) => {
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
  return { ...event, id };
};
var signEvent = async (event, keys) => {
  const sig = bytesToHex(await sign(event.id, keys.sk));
  return { ...event, sig };
};
var verifyEvent = async (event) => {
  const pkBytes = hexToBytes(event.pubkey);
  const reSigned = await hashEvent(event);
  const checkId = reSigned.id;
  return checkId === event.id && verify(event.sig, event.id, pkBytes);
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
var import_jtd = require("jtd");
var import_cross_fetch = __toESM(require("cross-fetch"), 1);
var import_weak_lru_cache = require("weak-lru-cache");
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
    cache = new import_weak_lru_cache.WeakLRUCache();
  };
  const check = async (event) => {
    const meta = JSON.parse(event.content || "");
    const errors = (0, import_jtd.validate)(nostr_default.metadata, meta);
    if (errors.length === 0) {
      if (cache.has(meta.nip05)) {
        return cache.getValue(meta.nip05);
      }
      const n05Name = parseNip05Name(meta.nip05);
      if (n05Name) {
        const url = nip05Url(n05Name);
        if (url) {
          const response = await (0, import_cross_fetch.default)(url);
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
var import_jtd2 = require("jtd");
var import_ulid = require("ulid");
var import_cross_fetch2 = __toESM(require("cross-fetch"), 1);
var import_weak_lru_cache2 = require("weak-lru-cache");
var import_isomorphic_ws = __toESM(require("isomorphic-ws"), 1);
var relayInfoUrl = (wsUrl) => new URL(`https://${new URL(wsUrl).host}/`);
var fetchRelayInfo = async (url) => {
  let response = Promise.resolve(void 0);
  try {
    const fetchResult = await (0, import_cross_fetch2.default)(relayInfoUrl(url), {
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
var mkSocket = (url) => new import_isomorphic_ws.default(url);
var mkPool = (wsFactory = mkSocket) => {
  const conns = /* @__PURE__ */ new Map();
  const rInfo = /* @__PURE__ */ new Map();
  const subscribers = {
    named: /* @__PURE__ */ new Map(),
    global: /* @__PURE__ */ new Set()
  };
  const recentEvents = new import_weak_lru_cache2.WeakLRUCache();
  let lastEvent;
  const activeRelays = () => [...conns.values()].length;
  const close = () => {
    for (const sock of conns.values()) {
      sock.close();
    }
  };
  const handleEvent = (subId, event) => {
    const errors = (0, import_jtd2.validate)(nostr_default.event, event);
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
      subId = subId || (0, import_ulid.ulid)();
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
    const subId = (0, import_ulid.ulid)();
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Annotation,
  EventKind,
  defaultFilters,
  fetchRelayInfo,
  hashEvent,
  keypair,
  mkMailbox,
  mkPool,
  randomKeypair,
  relayInfoUrl,
  resolver,
  schema,
  signEvent,
  verifyEvent
});
