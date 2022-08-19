---
title: Usage
---

# Basic Teahouse Usage

## NodeJS example

```js
import { mkPool, defaultFilters } from 'teahouse';

import fs from 'node:fs/promises';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const logfile = await fs.open(`${scriptDir}/data/out/feed.ndjson`, 'w+');

const pool = mkPool();
const relayInfo = await pool.connect('wss://relay.nostr.info');

console.log({ relayInfo });

pool.addFilter({});

let events = 0;

const unsub = pool.subscribe((event) => {
    if (event === undefined) return;

    logfile.write(`${JSON.stringify(event)}\n`);
    events += 1;
});

setTimeout(() => {
    unsub();
    logfile.close();
    console.log(`${events} written`);
    process.exit(0);
}, 10000);
```
