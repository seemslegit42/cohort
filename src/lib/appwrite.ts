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
    (clientObj['ping'] as () => void)();
  } else {
    // If typings or JS environment has a fallback
    const pingFn = clientObj['ping'];
    if (pingFn && typeof pingFn === 'function') {
      (pingFn as () => void)();
    }
  }
} catch (e) {
  console.warn("Skipping standard client.ping error/unsupported method:", e);
}

export { client, account, databases };
