import { EventKind, hashEvent, randomKeypair, schema, signEvent, verifyEvent } from 'teahouse-core';

import { Schema, validate } from 'jtd';
import assert from 'assert'

const check = async () => {
    const keypair = randomKeypair();

    const userEvent = await signEvent(await hashEvent({
        // load this from some external source; e.g., a relay `EVENT`
        // message, from disk, etc.
        content: 'this one should validate',
        kind: EventKind.Text,
        pubkey: keypair.pk,
        created_at: Date.now() / 1000,
    }), keypair);

    let errors = validate(schema.event as Schema, userEvent);

    assert(errors.length === 0);
    assert(verifyEvent(userEvent));

    console.log(`event ok`, { event: userEvent });

    const badEvent = await signEvent(await hashEvent({
        pubkey: keypair.pk
    } as any), keypair);

    errors = validate(schema.event as Schema, badEvent);
    assert(errors.length > 0);
    assert(verifyEvent(badEvent));

    console.log(`event bad`, { event: badEvent });
};

check();
