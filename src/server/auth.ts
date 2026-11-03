/// <reference path="../types/express.d.ts" />
import { Account, Teams } from 'node-appwrite';
import type { NextFunction, Request, Response } from 'express';
import { sessionCookieName } from './config';
import { createSessionClient, getAdminClient } from './appwrite-clients';

export { createSessionClient, getAdminClient } from './appwrite-clients';

export function readSessionSecret(req: Request): string | undefined {
  const name = sessionCookieName();
  const cookie = req.cookies?.[name];
  if (typeof cookie === 'string' && cookie.length > 0) {
    return cookie;
  }
  const header = req.headers['x-appwrite-session'];
  if (typeof header === 'string' && header.length > 0) {
    return header;
  }
  return undefined;
}

export async function requireAppwriteSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const secret = readSessionSecret(req);
  if (!secret) {
    res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
    return;
  }

  try {
    const ua = req.headers['user-agent'];
    const sessionClient = createSessionClient(
      secret,
      typeof ua === 'string' ? ua : undefined,
    );
    const account = new Account(sessionClient);
    const user = await account.get();
    req.appwriteUser = user;
    req.appwriteSessionClient = sessionClient;

    const teamHeader = req.headers['x-team-id'];
    if (typeof teamHeader === 'string' && teamHeader.trim()) {
      const teams = new Teams(sessionClient);
      const listed = await teams.list();
      const allowed = listed.teams.some((t) => t.$id === teamHeader.trim());
      if (!allowed) {
        res.status(403).json({ error: 'Forbidden team', code: 'TEAM_FORBIDDEN' });
        return;
      }
      req.activeTeamId = teamHeader.trim();
    }

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session', code: 'AUTH_INVALID' });
  }
}

/** Optional session — attaches user when cookie present. */
export async function optionalAppwriteSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const secret = readSessionSecret(req);
  if (!secret) {
    next();
    return;
  }
  try {
    const ua = req.headers['user-agent'];
    const sessionClient = createSessionClient(
      secret,
      typeof ua === 'string' ? ua : undefined,
    );
    const account = new Account(sessionClient);
    req.appwriteUser = await account.get();
    req.appwriteSessionClient = sessionClient;
  } catch {
    // ignore invalid optional session
  }
  next();
}

export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<{ secret: string; expire: string; userId: string }> {
  const account = new Account(getAdminClient());
  const session = await account.createEmailPasswordSession({ email, password });
  return {
    secret: session.secret,
    expire: session.expire,
    userId: session.userId,
  };
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
): Promise<{ secret: string; expire: string; userId: string }> {
  const { ID, Users } = await import('node-appwrite');
  const users = new Users(getAdminClient());
  const userId = ID.unique();
  await users.create({ userId, email, password, name });
  return loginWithEmailPassword(email, password);
}

export function setSessionCookie(res: Response, secret: string, expire: string): void {
  res.cookie(sessionCookieName(), secret, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'strict',
    expires: new Date(expire),
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(sessionCookieName(), { path: '/' });
}

function isProduction(): boolean {
  return process.env['NODE_ENV'] === 'production';
}
