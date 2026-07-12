import { Client, Account, Databases } from "appwrite";

const client = new Client()
    .setEndpoint("https://tor.cloud.appwrite.io/v1")
    .setProject("6990e2830030cacccd98");

const account = new Account(client);
const databases = new Databases(client);

// Automatically call ping to verify the setup as specified by instructions
try {
  console.log("Pinging Appwrite server...");
  const clientObj = client as unknown as Record<string, unknown>;
  if (typeof clientObj['ping'] === 'function') {
    const pingFn = clientObj['ping'] as () => unknown;
    const res = pingFn();
    if (res && typeof (res as Record<string, unknown>)['catch'] === 'function') {
      const catchFn = (res as Record<string, unknown>)['catch'] as (err: unknown) => void;
      catchFn((err: unknown) => {
        const errStr = err instanceof Error ? err.message : String(err);
        console.warn("Appwrite ping failed:", errStr);
      });
    }
  }
} catch (e) {
  console.warn("Skipping standard client.ping error/unsupported method:", e);
}

export { client, account, databases };
