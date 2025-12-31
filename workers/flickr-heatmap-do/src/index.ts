import { DurableObject } from "cloudflare:workers";

interface Env {
    HEATMAP_SNAPSHOT: DurableObjectNamespace;
}

export class HeatmapSnapshot extends DurableObject {
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
    }

    async fetch(request: Request): Promise<Response> {
        // PUT /:username - Store snapshot
        if (request.method === "PUT") {
            const data = await request.json();
            await this.ctx.storage.put("snapshot", data);
            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        // GET /:username - Get snapshot
        if (request.method === "GET") {
            const data = await this.ctx.storage.get("snapshot");
            if (!data) {
                return new Response(JSON.stringify({ error: "Not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                });
            }
            return new Response(JSON.stringify(data), {
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response("Method not allowed", { status: 405 });
    }
}

const worker = {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const pathParts = url.pathname.split("/").filter(Boolean);

        // Expected path: /:username
        if (pathParts.length === 0) {
            return new Response("Username required", { status: 400 });
        }

        const username = pathParts[0];

        // Get the Durable Object ID for this username
        // We use name-based IDs so the same username always maps to the same DO
        const id = env.HEATMAP_SNAPSHOT.idFromName(username);
        const stub = env.HEATMAP_SNAPSHOT.get(id);

        return stub.fetch(request);
    },
};

export default worker;
