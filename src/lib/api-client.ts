export type ApiFetchInit = RequestInit & { teamId?: string | null };

/** Same-origin CRM API calls — always sends session cookies and optional tenant header. */
export function apiFetch(input: string, init: ApiFetchInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const teamId = init.teamId;
  if (teamId) {
    headers.set('x-team-id', teamId);
  }
  const { teamId: _team, ...rest } = init;
  return fetch(input, {
    ...rest,
    headers,
    credentials: rest.credentials ?? 'include',
  });
}
