import jrpc from 'jsonrpc-lite';
import { validate } from 'jtd';

export type JrpcResponse = jrpc.SuccessObject | jrpc.ErrorObject;

export type Handler = (req: jrpc.RequestObject) => Promise<JrpcResponse>;
export type Handlers = Record<string, Handler>;

export const installHandlers(handlers: Handlers, on: SharedWorkerGlobalScope) => {
    $.onmessage = (ev: MessageEvent) => {
        const cmd = jrpc.parseObject(mev.data);
        if (cmd.type === jrpc.RpcStatusType.request) {
            const req = cmd.payload as jrpc.RequestObject;
            const method = req.method;
            const handler = handlers[method];

            let result: jrpc.

            if (handler) {
                try {
                    const result = await handler(req);
                    $.send(result);
            const result = handler ? await handler(req) : jrpc.methodNotFound(method);
            $.send(result);
        }
    });
}

