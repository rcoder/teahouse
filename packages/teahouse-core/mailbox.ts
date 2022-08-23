import { type Event } from './schema/gen/nostr';
import { type RelayPool, type Subscription } from './relay';

export enum Annotation {
    Seen,
    Read,
    Muted,
    Pinned,
}

export type Message = {
    event: Event,
    received: Date,
    annotations: Set<Annotation>,
};

export const mkMessage = (event: Event) => ({
    event,
    received: new Date(),
    annotations: new Set<Annotation>(),
});

export type Mailbox = {
    index: (msg: Message, related: boolean, timeout?: number) => Promise<void>,
    find: (id: string, related?: boolean, timeout?: number) => Promise<Message|undefined>,
    close: () => void;
};

export const mkMailbox: (pool: RelayPool) => Mailbox = (pool) => {
    const mailbox: Map<string, Message> = new Map();
    const openSubs: Subscription[] = [];

    const index = async (msg: Message, related = false, timeout?: number) => {
        const primaryId = msg.event.id;
        mailbox.set(msg.event.id, msg);

        if (related) {
            const receipt = pool.subscribe(async (e: Event) => {
                if (!mailbox.has(e.id)) {
                    mailbox.set(e.id, mkMessage(e));
                }
            }, undefined, { '#e': [primaryId] });

            openSubs.push(receipt);

            if (timeout) {
                setTimeout(receipt, timeout);
            }
        }
    }

    const find = async (id: string, related = false, timeout?: number) => {
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
}
