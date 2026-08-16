import { Client, Account, Databases } from "appwrite";

const client = new Client()
    .setEndpoint("https://tor.cloud.appwrite.io/v1")
    .setProject("6990e2830030cacccd98");

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };
