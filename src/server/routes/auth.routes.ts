import { Router } from 'express';
/// <reference path="../../types/express.d.ts" />
import { Account, Teams } from 'node-appwrite';
import {
  clearSessionCookie,
  createSessionClient,
  loginWithEmailPassword,
  readSessionSecret,
  registerUser,
  requireAppwriteSession,
  setSessionCookie,
} from '../auth';

export function createAuthRouter(): Router {
  const router = Router();

  router.post('/login', async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }
    try {
      const session = await loginWithEmailPassword(String(email), String(password));
      setSessionCookie(res, session.secret, session.expire);
      res.json({ success: true, userId: session.userId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      res.status(401).json({ error: message, code: 'LOGIN_FAILED' });
    }
  });

  router.post('/register', async (req, res) => {
    const { email, password, name } = req.body ?? {};
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name required' });
      return;
    }
    try {
      const session = await registerUser(
        String(email),
        String(password),
        String(name),
      );
      setSessionCookie(res, session.secret, session.expire);
      res.json({ success: true, userId: session.userId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      res.status(400).json({ error: message, code: 'REGISTER_FAILED' });
    }
  });

  router.post('/logout', requireAppwriteSession, async (req, res) => {
    try {
      const secret = readSessionSecret(req);
      if (secret) {
        const account = new Account(createSessionClient(secret));
        await account.deleteSession({ sessionId: 'current' });
      }
    } catch {
      // still clear cookie
    }
    clearSessionCookie(res);
    res.json({ success: true });
  });

  router.get('/me', requireAppwriteSession, (req, res) => {
    res.json({ user: req.appwriteUser, activeTeamId: req.activeTeamId ?? null });
  });

  router.get('/teams', requireAppwriteSession, async (req, res) => {
    try {
      const client = req.appwriteSessionClient;
      if (!client) {
        res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
        return;
      }
      const teams = new Teams(client);
      const list = await teams.list();
      res.json({ teams: list.teams });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to list teams';
      res.status(500).json({ error: message, code: 'TEAMS_LIST_FAILED' });
    }
  });

  return router;
}
