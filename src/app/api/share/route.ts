import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: Request) {
    try {
        const { username, data, year, activityType } = await request.json();

        if (!username || !data) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get the Cloudflare context to access the SNAPSHOT_SERVICE binding
        // In opennextjs-cloudflare, bindings are usually on the env object
        const { env } = await getCloudflareContext();

        if (!env.SNAPSHOT_SERVICE) {
            console.error("SNAPSHOT_SERVICE binding not found");
            return NextResponse.json(
                { error: "Service binding configuration error" },
                { status: 500 }
            );
        }

        // Call the Durable Object Worker
        // PUT /:username
        const response = await env.SNAPSHOT_SERVICE.fetch(
            `http://internal/${username}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    data,
                    year,
                    activityType,
                    timestamp: Date.now(),
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to save snapshot: ${response.statusText}`);
        }

        return NextResponse.json({ success: true, username });
    } catch (error) {
        console.error("Error saving snapshot:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
