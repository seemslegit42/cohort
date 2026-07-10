/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

export class Client {
  private endpoint = '';
  private projectId = '';
  private headers: Record<string, string> = {};

  setEndpoint(endpoint: string): this {
    this.endpoint = endpoint;
    return this;
  }

  setProject(projectId: string): this {
    this.projectId = projectId;
    this.headers['X-Appwrite-Project'] = projectId;
    return this;
  }

  setKey(key: string): this {
    this.headers['X-Appwrite-Key'] = key;
    return this;
  }

  getEndpoint(): string {
    return this.endpoint;
  }

  getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...this.headers
    };
  }

  async ping(): Promise<any> {
    const res = await fetch(`${this.endpoint}/health/version`, {
      headers: this.getHeaders()
    });
    return res.json();
  }
}

export class Account {
  constructor(private client: Client) {}

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const res = await fetch(`${this.client.getEndpoint()}${path}`, {
      ...options,
      headers: {
        ...this.client.getHeaders(),
        ...(options.headers as any)
      },
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message || 'Request failed');
    }
    return res.json();
  }

  async get(): Promise<any> {
    return this.request('/account', { method: 'GET' });
  }

  async createEmailPasswordSession(email: string, password: string): Promise<any> {
    return this.request('/account/sessions/email', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async create(userId: string, email: string, password: string, name?: string): Promise<any> {
    return this.request('/account', {
      method: 'POST',
      body: JSON.stringify({ userId, email, password, name })
    });
  }

  async deleteSession(sessionId: string): Promise<any> {
    return this.request(`/account/sessions/${sessionId}`, { method: 'DELETE' });
  }
}

export class Databases {
  constructor(private client: Client) {}

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const res = await fetch(`${this.client.getEndpoint()}${path}`, {
      ...options,
      headers: {
        ...this.client.getHeaders(),
        ...(options.headers as any)
      },
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message || 'Request failed');
    }
    return res.json();
  }

  async listDocuments(databaseId: string, collectionId: string, queries: string[] = []): Promise<any> {
    let url = `/databases/${databaseId}/collections/${collectionId}/documents`;
    if (queries.length > 0) {
      const qParams = queries.map(q => `queries[]=${encodeURIComponent(q)}`).join('&');
      url += `?${qParams}`;
    }
    return this.request(url, { method: 'GET' });
  }

  async createDocument(databaseId: string, collectionId: string, documentId: string, data: any, permissions?: string[]): Promise<any> {
    return this.request(`/databases/${databaseId}/collections/${collectionId}/documents`, {
      method: 'POST',
      body: JSON.stringify({ documentId, data, permissions })
    });
  }

  async updateDocument(databaseId: string, collectionId: string, documentId: string, data: any, permissions?: string[]): Promise<any> {
    return this.request(`/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ data, permissions })
    });
  }

  async deleteDocument(databaseId: string, collectionId: string, documentId: string): Promise<any> {
    return this.request(`/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`, {
      method: 'DELETE'
    });
  }
}

export class Teams {
  constructor(private client: Client) {}

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const res = await fetch(`${this.client.getEndpoint()}${path}`, {
      ...options,
      headers: {
        ...this.client.getHeaders(),
        ...(options.headers as any)
      },
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message || 'Request failed');
    }
    return res.json();
  }

  async list(): Promise<any> {
    return this.request('/teams', { method: 'GET' });
  }

  async create(teamId: string, name: string, roles: string[] = []): Promise<any> {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify({ teamId, name, roles })
    });
  }

  async createMembership(
    teamId: string,
    roles: string[],
    email?: string,
    userId?: string,
    phone?: string,
    url?: string,
    name?: string
  ): Promise<any> {
    return this.request(`/teams/${teamId}/memberships`, {
      method: 'POST',
      body: JSON.stringify({ email, roles, url, name, userId, phone })
    });
  }

  async updateName(teamId: string, name: string): Promise<any> {
    return this.request(`/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  }

  async delete(teamId: string): Promise<any> {
    return this.request(`/teams/${teamId}`, { method: 'DELETE' });
  }

  async listMemberships(teamId: string, queries: string[] = []): Promise<any> {
    return this.request(`/teams/${teamId}/memberships`, { method: 'GET' });
  }

  async deleteMembership(teamId: string, membershipId: string): Promise<any> {
    return this.request(`/teams/${teamId}/memberships/${membershipId}`, { method: 'DELETE' });
  }

  async getPrefs(teamId: string): Promise<any> {
    return this.request(`/teams/${teamId}/prefs`, { method: 'GET' });
  }

  async updatePrefs(teamId: string, prefs: any): Promise<any> {
    return this.request(`/teams/${teamId}/prefs`, {
      method: 'PUT',
      body: JSON.stringify({ prefs })
    });
  }
}

export class Functions {
  constructor(private client: Client) {}

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const res = await fetch(`${this.client.getEndpoint()}${path}`, {
      ...options,
      headers: {
        ...this.client.getHeaders(),
        ...(options.headers as any)
      },
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message || 'Request failed');
    }
    return res.json();
  }

  async createExecution(functionId: string, body?: string, async?: boolean, path?: string, method?: string, headers?: any): Promise<any> {
    return this.request(`/functions/${functionId}/executions`, {
      method: 'POST',
      body: JSON.stringify({ body, async, path, method, headers })
    });
  }
}

export class Realtime {
  constructor(private client: Client) {}
  subscribe(channels: string | string[], callback: (response: any) => void): any {
    console.log('Realtime subscribed to channels:', channels);
    return {
      unsubscribe: () => {
        console.log('Realtime unsubscribed from channels:', channels);
      }
    };
  }
}

export const ID = {
  unique: (size?: number): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = size || 20;
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  custom: (id: string): string => id
};

export const Query = {
  equal: (attribute: string, value: any): string => `equal("${attribute}", ${JSON.stringify(value)})`,
  limit: (value: number): string => `limit(${value})`,
  orderAsc: (attribute: string): string => `orderAsc("${attribute}")`,
  orderDesc: (attribute: string): string => `orderDesc("${attribute}")`
};

export const Permission = {
  read: (role: string): string => `read("${role}")`,
  write: (role: string): string => `write("${role}")`,
  create: (role: string): string => `create("${role}")`,
  update: (role: string): string => `update("${role}")`,
  delete: (role: string): string => `delete("${role}")`
};

export const Role = {
  any: (): string => 'any',
  user: (userId: string, status?: string): string => `user:${userId}${status ? `/${status}` : ''}`,
  team: (teamId: string, role?: string): string => `team:${teamId}${role ? `/${role}` : ''}`,
  member: (membershipId: string): string => `member:${membershipId}`
};
