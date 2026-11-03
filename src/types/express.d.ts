import type { Client, Models } from 'node-appwrite';

declare global {
  namespace Express {
    interface Request {
      appwriteUser?: Models.User<Models.Preferences>;
      appwriteSessionClient?: Client;
      activeTeamId?: string;
    }
  }
}

export {};
