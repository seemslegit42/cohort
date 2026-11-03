import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Appwrite } from './appwrite';

/** Attach session cookies and active team to same-origin `/api` HttpClient calls. */
export const crmApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }
  const teamId = inject(Appwrite).activeTeam()?.$id;
  const headers: Record<string, string> = {};
  if (teamId) {
    headers['x-team-id'] = teamId;
  }
  return next(
    req.clone({
      setHeaders: headers,
      withCredentials: true,
    }),
  );
};
