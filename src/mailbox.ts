import { Annotation, type Message, type RelayPool } from '.';
import { type Subscription } from './relay';

export type Mailbox = {
    find: (id: string) => Message|undefined,
    close: () => void;
}

export const mkMailbox = (pool: RelayPool) => {
    const mailbox: Map<string, Message> = new Map();
    const openSubs: Subscription[] = [];

    const find = async (id: string, related = false, timeout?: number) => {
        if (mailbox.has(id)) {
            return mailbox.get(id);
        } else {
            const q = await pool.query({ ids: [id] }, timeout);
            const event = await q.query;

            if (related) {
                const receipt = pool.subscribe((e: Event) => {
                    mailbox.set(e.id, e);
                }, undefined, { '#e': [id] });

                openSubs.push(receipt);

                if (timeout) {
                    setTimeout(receipt, timeout);
                }
            }
        }
    };

    const close = () => {
        for (const receipt of openSubs) {
            receipt();
        }
    }
}
