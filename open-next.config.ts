// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";
const dummyCache = async () => ({
    get: async () => null,
    set: async () => { },
    delete: async () => { },
    name: "dummy"
});

export default defineCloudflareConfig({
    incrementalCache: dummyCache as any,
    tagCache: "dummy" as any,
});
