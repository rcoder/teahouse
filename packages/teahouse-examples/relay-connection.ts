import {
    type Event,
    EventKind,
    hashEvent,
    signEvent,
    randomKeypair,
    defaultFilters,
    mkPool
} from 'teahouse-core';

import assert from 'assert';

const relay = 'wss://relay.rants.pub';

const check = async () => {
    const pool = mkPool();
    console.log(`connecting to ${relay}`);

    const relayInfo = await pool.connect(relay, true);
    assert(pool.activeRelays() === 1);

    console.log(`connected`, { relayInfo });

    const keys = await randomKeypair();

    const receipt = pool.subscribe(async (e: Event) => {
        console.log(`relay returned`, { e });
        if (e.id == event.id) {
            console.log(`got own event!`, { e });
        }
    }, undefined, { authors: [keys.pk] })

    const event = await signEvent(await hashEvent({
        content: 'just setting up my nostr',
        kind: EventKind.Text,
        created_at: Date.now() / 1000,
        pubkey: keys.pk,
    }), keys);

    console.log(`publishing`, { event });
    pool.publish(event);

    setTimeout(() => {
        console.log(`exiting`);
        receipt();
        pool.close();
    }, 5000);
};

check();
