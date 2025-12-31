import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json(
                { error: "Username is required" },
                { status: 400 }
            );
        }

        const { env } = await getCloudflareContext();

        if (!env.SNAPSHOT_SERVICE) {
            console.error("SNAPSHOT_SERVICE binding not found");
            return NextResponse.json(
                { error: "Service binding configuration error" },
                { status: 500 }
            );
        }

        const response = await env.SNAPSHOT_SERVICE.fetch(
            `http://internal/${username}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            }
        );

        if (response.status === 404) {
            return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch snapshot: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching snapshot:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
